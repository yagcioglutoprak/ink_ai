"""
Flask server — /api/chat streaming endpoint + conversation CRUD.
Supports any OpenAI-compatible API via OPENAI_BASE_URL.
Phase 4: Tool calls with Exa web search.
"""

import os
import json
import time
import logging
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Optional MongoDB Atlas ──────────────────────────────
from db import init_db
db = init_db()


# ── Helpers ─────────────────────────────────────────────

def get_client() -> OpenAI:
    return OpenAI(
        api_key=os.environ.get('OPENAI_API_KEY', ''),
        base_url=os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    )


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def format_messages(messages: list[dict], system_prompt: str = '') -> list[dict]:
    """Convert frontend messages to OpenAI chat completion format."""
    formatted = []
    if system_prompt:
        formatted.append({'role': 'system', 'content': system_prompt})
    for msg in messages:
        formatted.append({
            'role': msg['role'],
            'content': msg['content'],
        })
    return formatted


# ── Tool definitions (OpenAI function-calling format) ───

WEB_SEARCH_TOOL = {
    'type': 'function',
    'function': {
        'name': 'web_search',
        'description': (
            'Search the web for current information. Use this when the user asks about '
            'recent events, needs up-to-date data, wants to look something up, or when '
            'your knowledge might be outdated. Returns titles, URLs, and text snippets.'
        ),
        'parameters': {
            'type': 'object',
            'properties': {
                'query': {
                    'type': 'string',
                    'description': 'The search query to look up on the web.',
                },
            },
            'required': ['query'],
        },
    },
}

RENDER_UI_TOOL = {
    'type': 'function',
    'function': {
        'name': 'render_ui',
        'description': (
            'Render a SMALL compact interactive widget inline in the chat. '
            'ONLY for: color palettes, comparison tables, pros/cons, progress trackers, mini calculators, small interactive components. '
            'NEVER use for websites, landing pages, dashboards, or multi-section layouts — '
            'for those, write code in a fenced markdown code block instead.\n\n'
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
        'parameters': {
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
        thinking_start_time: float | None = None
        full_thinking = ''
        full_text = ''

        try:
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
            # Always include web search — model decides when to use it
            tools.extend(TOOLS_SEARCH)
            system_prompt = (system_prompt + '\n\n' if system_prompt else '') + (
                'You have access to a web_search tool. Use it when the user asks about '
                'recent events, needs current data, or when your knowledge may be outdated. '
                'Always cite your sources with URLs when using search results.'
            )

            # Widget catalogue guidance
            system_prompt = (system_prompt + '\n\n' if system_prompt else '') + (
                'You have a render_ui tool that renders SMALL live interactive widgets inline in the chat. '
                'Use render_ui ONLY for compact widgets like comparisons, color palettes, pros/cons tables, '
                'step trackers, mini calculators, or small interactive components. '
                'NEVER use render_ui for full websites, landing pages, dashboards, or multi-section layouts. '
                'For any code request (websites, apps, pages, full designs), write the code in a fenced '
                'code block (```html, ```jsx, etc.) so it opens in the artifact/code viewer panel instead.'
            )

            api_messages = format_messages(messages, system_prompt)

            # Build params for OpenAI chat completions
            params: dict = {
                'model': model,
                'max_tokens': int(os.environ.get('MAX_TOKENS', '8192')),
                'messages': api_messages,
                'stream': True,
                'stream_options': {'include_usage': False},
            }

            if tools:
                params['tools'] = tools
                params['tool_choice'] = 'auto'

            # Extended thinking — provider-specific
            # Pass via extra_body so it reaches providers that support it
            # without breaking the OpenAI SDK's parameter validation.
            if enable_thinking:
                thinking_budget = int(os.environ.get('THINKING_BUDGET', '10000'))
                params['max_tokens'] = max(params['max_tokens'], 16000)
                params['extra_body'] = {
                    'thinking': {
                        'type': 'enabled',
                        'budget_tokens': thinking_budget,
                    },
                }

            # Loop to handle tool use → result → continuation
            while True:
                stream = client.chat.completions.create(**params)

                # Track tool calls during streaming
                # key = tool call index, value = {id, name, arguments}
                tool_calls_map: dict[int, dict] = {}
                finish_reason = None
                in_thinking = False

                for chunk in stream:
                    if not chunk.choices:
                        continue

                    choice = chunk.choices[0]
                    delta = choice.delta
                    finish_reason = choice.finish_reason or finish_reason

                    # ── Thinking / reasoning content ────────
                    # Many providers expose reasoning via `reasoning_content` field
                    reasoning = getattr(delta, 'reasoning_content', None) or getattr(delta, 'reasoning', None)
                    if reasoning:
                        if not in_thinking:
                            in_thinking = True
                            thinking_start_time = time.time()
                            full_thinking = ''
                            yield sse({'type': 'thinking_start'})
                        full_thinking += reasoning
                        yield sse({'type': 'thinking_delta', 'content': reasoning})

                    # ── Text content ────────────────────────
                    if delta.content:
                        # If we were in thinking, close it first
                        if in_thinking:
                            in_thinking = False
                            duration = int((time.time() - thinking_start_time) * 1000) if thinking_start_time else 0
                            yield sse({'type': 'thinking_end', 'durationMs': duration})
                            thinking_start_time = None

                        full_text += delta.content
                        yield sse({'type': 'text_delta', 'content': delta.content})

                    # ── Tool calls ──────────────────────────
                    if delta.tool_calls:
                        # If we were in thinking, close it first
                        if in_thinking:
                            in_thinking = False
                            duration = int((time.time() - thinking_start_time) * 1000) if thinking_start_time else 0
                            yield sse({'type': 'thinking_end', 'durationMs': duration})
                            thinking_start_time = None

                        for tc_delta in delta.tool_calls:
                            idx = tc_delta.index
                            if idx not in tool_calls_map:
                                tool_calls_map[idx] = {
                                    'id': tc_delta.id or '',
                                    'name': '',
                                    'arguments': '',
                                    'started': False,
                                }
                            tc = tool_calls_map[idx]
                            if tc_delta.id:
                                tc['id'] = tc_delta.id
                            if tc_delta.function:
                                if tc_delta.function.name:
                                    tc['name'] = tc_delta.function.name
                                    # Emit tool_call_start immediately
                                    tc['started'] = True
                                    yield sse({
                                        'type': 'tool_call_start',
                                        'id': tc['id'],
                                        'toolName': tc['name'],
                                        'args': {},
                                    })
                                if tc_delta.function.arguments:
                                    tc['arguments'] += tc_delta.function.arguments
                                    # Stream render_ui args in real-time
                                    if tc['name'] == 'render_ui':
                                        yield sse({
                                            'type': 'render_ui_delta',
                                            'id': tc['id'],
                                            'partialArgs': tc['arguments'],
                                        })

                # Close thinking if still open at end of stream
                if in_thinking:
                    in_thinking = False
                    duration = int((time.time() - thinking_start_time) * 1000) if thinking_start_time else 0
                    yield sse({'type': 'thinking_end', 'durationMs': duration})
                    thinking_start_time = None

                # If the model made tool calls, execute them and continue
                if finish_reason == 'tool_calls' or tool_calls_map:
                    # Build the assistant message with tool calls
                    assistant_tool_calls = []
                    for idx in sorted(tool_calls_map.keys()):
                        tc = tool_calls_map[idx]
                        assistant_tool_calls.append({
                            'id': tc['id'],
                            'type': 'function',
                            'function': {
                                'name': tc['name'],
                                'arguments': tc['arguments'],
                            },
                        })

                    # Build assistant message content
                    assistant_msg: dict = {'role': 'assistant', 'content': full_text or None}
                    if full_thinking:
                        assistant_msg['reasoning_content'] = full_thinking
                    if assistant_tool_calls:
                        assistant_msg['tool_calls'] = assistant_tool_calls
                    api_messages.append(assistant_msg)

                    # Execute each tool and append results
                    for tc_obj in assistant_tool_calls:
                        tool_name = tc_obj['function']['name']
                        try:
                            tool_input = json.loads(tc_obj['function']['arguments']) if tc_obj['function']['arguments'] else {}
                        except json.JSONDecodeError:
                            tool_input = {}

                        # Only emit tool_call_start if not already emitted during streaming
                        already_started = any(
                            tc.get('started') and tc['id'] == tc_obj['id']
                            for tc in tool_calls_map.values()
                        )
                        if not already_started:
                            yield sse({
                                'type': 'tool_call_start',
                                'id': tc_obj['id'],
                                'toolName': tool_name,
                                'args': tool_input,
                            })

                        start_time = time.time()
                        result = execute_tool(tool_name, tool_input)
                        duration = int((time.time() - start_time) * 1000)

                        if 'error' in result and not result.get('results'):
                            yield sse({
                                'type': 'tool_call_error',
                                'id': tc_obj['id'],
                                'error': result['error'],
                                'durationMs': duration,
                            })
                        else:
                            yield sse({
                                'type': 'tool_call_result',
                                'id': tc_obj['id'],
                                'result': result,
                                'durationMs': duration,
                            })

                        # Append tool result message for the model
                        api_messages.append({
                            'role': 'tool',
                            'tool_call_id': tc_obj['id'],
                            'content': json.dumps(result),
                        })

                    # Update params with new messages and reset state
                    params['messages'] = api_messages
                    tool_calls_map = {}
                    full_text = ''
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

        except Exception as e:
            error_msg = str(e)
            status_code = getattr(e, 'status_code', None)

            if status_code == 429:
                yield sse({
                    'type': 'error',
                    'error': 'Rate limit exceeded. Please wait and try again.',
                    'retryAfter': 60,
                })
            elif status_code:
                yield sse({
                    'type': 'error',
                    'error': f'API error ({status_code}): {error_msg}',
                })
            else:
                logger.exception('Stream error')
                yield sse({
                    'type': 'error',
                    'error': error_msg,
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


# ── Conversation CRUD (MongoDB Atlas) ───────────────────

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
