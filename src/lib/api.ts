/** API client — SSE streaming + conversation CRUD */

import type { Conversation } from '../types'

/* ── Conversation CRUD ──────────────────────────────────── */

export async function fetchConversations(): Promise<Conversation[] | null> {
  try {
    const res = await fetch('/api/conversations')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`/api/conversations/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function saveConversation(conversation: Conversation): Promise<boolean> {
  try {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversation),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function deleteConversationApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

/* ── SSE streaming client for /api/chat ─────────────────── */

export interface StreamEvent {
  type:
    | 'thinking_start'
    | 'thinking_delta'
    | 'thinking_end'
    | 'text_start'
    | 'text_delta'
    | 'text_end'
    | 'tool_call_start'
    | 'tool_call_result'
    | 'tool_call_error'
    | 'done'
    | 'error'
  content?: string
  durationMs?: number
  error?: string
  retryAfter?: number
  // Tool call fields
  id?: string
  toolName?: string
  args?: Record<string, unknown>
  result?: unknown
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  model?: string
  thinking?: boolean
  tools?: boolean
  conversationId?: string
}

export async function* streamChat(
  req: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })

  if (!response.ok) {
    yield {
      type: 'error',
      error: `Server error (${response.status}): ${response.statusText}`,
    }
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          try {
            yield JSON.parse(trimmed.slice(6)) as StreamEvent
          } catch {
            // skip malformed events
          }
        }
      }
    }

    // flush remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        yield JSON.parse(buffer.trim().slice(6)) as StreamEvent
      } catch {
        // skip
      }
    }
  } finally {
    reader.releaseLock()
  }
}
