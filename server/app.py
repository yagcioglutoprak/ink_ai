"""
Flask server — /api/chat streaming endpoint + conversation CRUD.
Supports any Anthropic-compatible API via ANTHROPIC_BASE_URL.
"""

import os
import json
import time
import logging
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Optional Azure Cosmos DB ────────────────────────────
from db import init_db
db = init_db()


# ── Helpers ─────────────────────────────────────────────

def get_client() -> anthropic.Anthropic:
    kwargs: dict = {
        'api_key': os.environ.get('ANTHROPIC_API_KEY', ''),
    }
    base_url = os.environ.get('ANTHROPIC_BASE_URL')
    if base_url:
        kwargs['base_url'] = base_url
    return anthropic.Anthropic(**kwargs)


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def format_messages(messages: list[dict]) -> list[dict]:
    """Convert frontend messages to Anthropic API format."""
    formatted = []
    for msg in messages:
        formatted.append({
            'role': msg['role'],
            'content': msg['content'],
        })
    return formatted


# ── POST /api/chat — SSE streaming ─────────────────────

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    messages = data.get('messages', [])
    model = data.get('model', os.environ.get('MODEL', 'claude-sonnet-4-20250514'))
    enable_thinking = data.get('thinking',
                               os.environ.get('ENABLE_THINKING', 'false').lower() == 'true')
    conversation_id = data.get('conversationId')

    if not messages:
        return jsonify({'error': 'messages required'}), 400

    client = get_client()

    def generate():
        block_types: dict[int, str] = {}
        thinking_start_time: float | None = None
        full_thinking = ''
        full_text = ''

        try:
            params: dict = {
                'model': model,
                'max_tokens': int(os.environ.get('MAX_TOKENS', '8192')),
                'messages': format_messages(messages),
                'stream': True,
            }

            system_prompt = os.environ.get('SYSTEM_PROMPT')
            if system_prompt:
                params['system'] = system_prompt

            if enable_thinking:
                params['thinking'] = {
                    'type': 'enabled',
                    'budget_tokens': int(os.environ.get('THINKING_BUDGET', '10000')),
                }
                params['max_tokens'] = max(params['max_tokens'], 16000)

            stream = client.messages.create(**params)

            for event in stream:
                if event.type == 'content_block_start':
                    block = event.content_block
                    block_types[event.index] = block.type
                    if block.type == 'thinking':
                        thinking_start_time = time.time()
                        full_thinking = ''
                        yield sse({'type': 'thinking_start'})
                    elif block.type == 'text':
                        yield sse({'type': 'text_start'})

                elif event.type == 'content_block_delta':
                    delta = event.delta
                    if delta.type == 'thinking_delta':
                        full_thinking += delta.thinking
                        yield sse({'type': 'thinking_delta', 'content': delta.thinking})
                    elif delta.type == 'text_delta':
                        full_text += delta.text
                        yield sse({'type': 'text_delta', 'content': delta.text})

                elif event.type == 'content_block_stop':
                    btype = block_types.get(event.index)
                    if btype == 'thinking' and thinking_start_time is not None:
                        duration = int((time.time() - thinking_start_time) * 1000)
                        yield sse({'type': 'thinking_end', 'durationMs': duration})
                        thinking_start_time = None
                    elif btype == 'text':
                        yield sse({'type': 'text_end'})

                elif event.type == 'message_stop':
                    yield sse({'type': 'done'})

            # Persist assistant response to DB
            if db and conversation_id:
                try:
                    conv = db.get_conversation(conversation_id)
                    if conv:
                        conv.setdefault('messages', []).append({
                            'role': 'assistant',
                            'content': full_text,
                            'thinking': full_thinking or None,
                            'createdAt': int(time.time() * 1000),
                        })
                        conv['updatedAt'] = int(time.time() * 1000)
                        db.save_conversation(conv)
                except Exception as e:
                    logger.warning('DB save failed: %s', e)

        except anthropic.RateLimitError:
            yield sse({
                'type': 'error',
                'error': 'Rate limit exceeded. Please wait and try again.',
                'retryAfter': 60,
            })
        except anthropic.APIStatusError as e:
            yield sse({
                'type': 'error',
                'error': f'API error ({e.status_code}): {e.message}',
            })
        except Exception as e:
            logger.exception('Stream error')
            yield sse({
                'type': 'error',
                'error': str(e),
            })

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        },
    )


# ── Conversation CRUD (Azure Cosmos DB) ─────────────────

@app.route('/api/conversations', methods=['GET'])
def list_conversations():
    if not db:
        return jsonify([])
    return jsonify(db.list_conversations())


@app.route('/api/conversations/<conv_id>', methods=['GET'])
def get_conversation(conv_id: str):
    if not db:
        return jsonify({'error': 'Database not configured'}), 503
    conv = db.get_conversation(conv_id)
    if not conv:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(conv)


@app.route('/api/conversations', methods=['POST'])
def save_conversation():
    if not db:
        return jsonify({'error': 'Database not configured'}), 503
    data = request.json or {}
    if not data.get('id'):
        return jsonify({'error': 'id required'}), 400
    db.save_conversation(data)
    return jsonify({'ok': True}), 200


@app.route('/api/conversations/<conv_id>', methods=['DELETE'])
def delete_conversation(conv_id: str):
    if not db:
        return jsonify({'error': 'Database not configured'}), 503
    db.delete_conversation(conv_id)
    return jsonify({'ok': True}), 200


# ── Health check ────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'db': db is not None,
        'model': os.environ.get('MODEL', 'claude-sonnet-4-20250514'),
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
