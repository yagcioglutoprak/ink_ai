/** SSE streaming client for /api/chat */

export interface StreamEvent {
  type:
    | 'thinking_start'
    | 'thinking_delta'
    | 'thinking_end'
    | 'text_start'
    | 'text_delta'
    | 'text_end'
    | 'done'
    | 'error'
  content?: string
  durationMs?: number
  error?: string
  retryAfter?: number
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  model?: string
  thinking?: boolean
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
