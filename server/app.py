"""
Flask server — /api/chat streaming endpoint + conversation CRUD.
Supports any Anthropic-compatible API via ANTHROPIC_BASE_URL.
Phase 4: Tool calls with Exa web search.
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
    base_url = os.environ.get('ANTHROPIC_BASE_URL', 'https://opencode.ai/zen/v1')
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


# ── Tool definitions ────────────────────────────────────

WEB_SEARCH_TOOL = {
    'name': 'web_search',
    'description': (
        'Search the web for current information. Use this when the user asks about '
        'recent events, needs up-to-date data, wants to look something up, or when '
        'your knowledge might be outdated. Returns titles, URLs, and text snippets.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'query': {
                'type': 'string',
                'description': 'The search query to look up on the web.',
            },
        },
        'required': ['query'],
    },
}

RENDER_UI_TOOL = {
    'name': 'render_ui',
    'description': (
        'Render a live interactive UI widget inline in the chat. Use this when structured '
        'visual output would answer the user better than plain text — for example color palettes, '
        'comparison tables, pros/cons lists, or progress trackers.\n\n'
        'Available widget types and their props:\n\n'
        '1. ColorPalette — Show color swatches.\n'
        '   props: { "colors": [{ "name": "Sand", "hex": "#C8A97E", "role": "background" }, ...] }\n\n'
        '2. ComparisonTable — Compare items across criteria.\n'
        '   props: { "items": ["React", "Vue"], "criteria": [{ "label": "Speed", "values": ["Fast", "Fast"] }] }\n\n'
        '3. ProsConsList — Show pros and cons.\n'
        '   props: { "topic": "TypeScript", "pros": ["Type safety", ...], "cons": ["Verbose", ...] }\n\n'
        '4. ProgressTracker — Track steps.\n'
        '   props: { "steps": [{ "label": "Step 1", "done": true }, { "label": "Step 2", "done": false }] }\n\n'
        'You may also generate arbitrary React JSX components by setting mode to "generated" and '
        'providing code. The code runs in a sandboxed iframe with React 18. '
        'Use the global `render(<Component />)` function to mount. '
        'A `ds` design system object is available with colors, shadows, fonts, and helpers like '
        'ds.card(), ds.btn(), ds.stamp, ds.heading(size). '
        'Available hooks: useState, useEffect, useRef, useCallback, useMemo, useReducer.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'mode': {
                'type': 'string',
                'enum': ['widget', 'generated'],
                'description': 'widget = use a pre-built widget type, generated = provide custom JSX code.',
            },
            'widget_type': {
                'type': 'string',
                'enum': ['ColorPalette', 'ComparisonTable', 'ProsConsList', 'ProgressTracker'],
                'description': 'Required when mode=widget. The widget to render.',
            },
            'props': {
                'type': 'object',
                'description': 'Required when mode=widget. The props object for the chosen widget.',
            },
            'code': {
                'type': 'string',
                'description': 'Required when mode=generated. Raw JSX component code. Must call render(<Component />) at the end.',
            },
            'caption': {
                'type': 'string',
                'description': 'Optional short caption shown above the widget.',
            },
        },
        'required': ['mode'],
    },
}

TOOLS_SEARCH = [WEB_SEARCH_TOOL]
TOOLS_UI = [RENDER_UI_TOOL]


def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute a tool call and return the result."""
    if tool_name == 'web_search':
        return execute_web_search(tool_input.get('query', ''))
    if tool_name == 'render_ui':
        return {'rendered': True}
    return {'error': f'Unknown tool: {tool_name}'}


def execute_web_search(query: str) -> dict:
    """Execute a web search using the Exa API."""
    api_key = os.environ.get('EXA_API_KEY')
    if not api_key:
        return {'error': 'EXA_API_KEY not configured'}

    try:
        from exa_py import Exa
        exa = Exa(api_key=api_key)
        results = exa.search(
            query=query,
            type='auto',
            num_results=8,
            contents={'text': {'max_characters': 3000}},
        )
        search_results = []
        for r in results.results:
            search_results.append({
                'title': r.title or '',
                'url': r.url or '',
                'snippet': (r.text or '')[:400],
            })
        return {
            'query': query,
            'results': search_results,
            'count': len(search_results),
        }
    except Exception as e:
        logger.exception('Exa search error')
        return {'error': str(e), 'query': query}


# ── POST /api/chat — SSE streaming ─────────────────────

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    messages = data.get('messages', [])
    model = data.get('model', os.environ.get('MODEL', 'opencode/minimax-m2.5-free'))
    enable_thinking = data.get('thinking',
                               os.environ.get('ENABLE_THINKING', 'false').lower() == 'true')
    enable_tools = data.get('tools', False)
    conversation_id = data.get('conversationId')

    if not messages:
        return jsonify({'error': 'messages required'}), 400

    client = get_client()

    def generate():
        block_types: dict[int, str] = {}
        thinking_start_time: float | None = None
        full_thinking = ''
        full_text = ''

        # Track tool calls during streaming
        tool_calls: dict[int, dict] = {}

        try:
            params: dict = {
                'model': model,
                'max_tokens': int(os.environ.get('MAX_TOKENS', '8192')),
                'messages': format_messages(messages),
                'stream': True,
            }

            system_prompt = os.environ.get('SYSTEM_PROMPT', '') or (
                'You are INK.AI — a friendly, sharp, and confident AI assistant with a neo-brutalist attitude. '
                'You speak in a warm but direct tone. You keep answers concise and punchy — no fluff, no filler. '
                'You use bold formatting, short paragraphs, and structured output when it helps. '
                'You never use emojis. You love building things, explaining clearly, and making the user feel like they have a brilliant collaborator. '
                'When asked to create something visual, you lean into the brutalist aesthetic: thick borders, flat colors, hard shadows, monospace type.'
            )

            # Always include render_ui tool for generative UI
            tools = list(TOOLS_UI)

            # Add web search tool when enabled
            if enable_tools:
                tools.extend(TOOLS_SEARCH)
                system_prompt = (system_prompt + '\n\n' if system_prompt else '') + (
                    'You have access to a web_search tool. Use it when the user asks about '
                    'recent events, needs current data, or when your knowledge may be outdated. '
                    'Always cite your sources with URLs when using search results.'
                )

            # Widget catalogue guidance
            system_prompt = (system_prompt + '\n\n' if system_prompt else '') + (
                'You have a render_ui tool that renders live interactive widgets inline in the chat. '
                'PREFER render_ui over plain text when the answer involves structured data like '
                'comparisons, color palettes, pros/cons, step tracking, or interactive components. '
                'For complex or custom UI (calculators, visualizations, games), use mode="generated" '
                'and write React JSX code.'
            )

            params['tools'] = tools

            if system_prompt:
                params['system'] = system_prompt

            if enable_thinking:
                params['thinking'] = {
                    'type': 'enabled',
                    'budget_tokens': int(os.environ.get('THINKING_BUDGET', '10000')),
                }
                params['max_tokens'] = max(params['max_tokens'], 16000)

            api_messages = format_messages(messages)
            params['messages'] = api_messages

            # Loop to handle tool use → result → continuation
            while True:
                params['messages'] = api_messages
                stream = client.messages.create(**params)

                stop_reason = None
                current_tool_use_block: dict | None = None
                response_content: list[dict] = []

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

                        elif block.type == 'tool_use':
                            current_tool_use_block = {
                                'id': block.id,
                                'name': block.name,
                                'input_json': '',
                            }
                            tool_calls[event.index] = current_tool_use_block

                    elif event.type == 'content_block_delta':
                        delta = event.delta
                        if delta.type == 'thinking_delta':
                            full_thinking += delta.thinking
                            yield sse({'type': 'thinking_delta', 'content': delta.thinking})
                        elif delta.type == 'text_delta':
                            full_text += delta.text
                            yield sse({'type': 'text_delta', 'content': delta.text})
                        elif delta.type == 'input_json_delta':
                            tc = tool_calls.get(event.index)
                            if tc:
                                tc['input_json'] += delta.partial_json

                    elif event.type == 'content_block_stop':
                        btype = block_types.get(event.index)

                        if btype == 'thinking' and thinking_start_time is not None:
                            duration = int((time.time() - thinking_start_time) * 1000)
                            yield sse({'type': 'thinking_end', 'durationMs': duration})
                            thinking_start_time = None
                            response_content.append({
                                'type': 'thinking',
                                'thinking': full_thinking,
                            })

                        elif btype == 'text':
                            yield sse({'type': 'text_end'})
                            response_content.append({
                                'type': 'text',
                                'text': full_text,
                            })

                        elif btype == 'tool_use':
                            tc = tool_calls.get(event.index)
                            if tc:
                                try:
                                    tool_input = json.loads(tc['input_json']) if tc['input_json'] else {}
                                except json.JSONDecodeError:
                                    tool_input = {}

                                yield sse({
                                    'type': 'tool_call_start',
                                    'id': tc['id'],
                                    'toolName': tc['name'],
                                    'args': tool_input,
                                })

                                response_content.append({
                                    'type': 'tool_use',
                                    'id': tc['id'],
                                    'name': tc['name'],
                                    'input': tool_input,
                                })

                                # Execute the tool
                                start_time = time.time()
                                result = execute_tool(tc['name'], tool_input)
                                duration = int((time.time() - start_time) * 1000)

                                if 'error' in result and not result.get('results'):
                                    yield sse({
                                        'type': 'tool_call_error',
                                        'id': tc['id'],
                                        'error': result['error'],
                                        'durationMs': duration,
                                    })
                                else:
                                    yield sse({
                                        'type': 'tool_call_result',
                                        'id': tc['id'],
                                        'result': result,
                                        'durationMs': duration,
                                    })

                    elif event.type == 'message_delta':
                        stop_reason = event.delta.stop_reason

                    elif event.type == 'message_stop':
                        pass

                # If the model stopped because it wants to use a tool, continue the loop
                if stop_reason == 'tool_use':
                    # Build tool results for all tool calls in this turn
                    tool_result_content = []
                    for tc in tool_calls.values():
                        try:
                            tool_input = json.loads(tc['input_json']) if tc['input_json'] else {}
                        except json.JSONDecodeError:
                            tool_input = {}
                        result = execute_tool(tc['name'], tool_input)
                        tool_result_content.append({
                            'type': 'tool_result',
                            'tool_use_id': tc['id'],
                            'content': json.dumps(result),
                        })

                    api_messages.append({'role': 'assistant', 'content': response_content})
                    api_messages.append({'role': 'user', 'content': tool_result_content})

                    # Reset state for next iteration
                    block_types = {}
                    tool_calls = {}
                    full_text = ''
                    response_content = []
                    continue
                else:
                    yield sse({'type': 'done'})
                    break

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
        'model': os.environ.get('MODEL', 'opencode/minimax-m2.5-free'),
        'exa': bool(os.environ.get('EXA_API_KEY')),
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
