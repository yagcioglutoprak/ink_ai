import { useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import './styles/globals.css'
import { useConversations } from './hooks/useConversations'
import Sidebar from './components/layout/Sidebar'
import ChatPanel from './components/layout/ChatPanel'
import type { Message, ContentBlock } from './types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/* ── Mock streaming data ────────────────────────────────── */
const MOCK_THINKING = `The user is asking me a question. Let me reason through this carefully.

I should consider multiple angles here and provide a thorough, well-structured answer. Let me think about what would be most helpful...

I'll break my response into clear sections so it's easy to follow.`

const MOCK_RESPONSES = [
  `Great question! Here's what I think:\n\nThe key insight is that good software design comes from understanding the problem deeply before writing code. Start with the user's needs, then work backwards to the implementation.\n\nHere are three principles I'd recommend:\n\n1. **Keep it simple** — the best code is code you don't have to write\n2. **Make it readable** — you'll read code 10x more than you write it\n3. **Test the edges** — bugs hide where you least expect them`,
  `I'd be happy to help with that!\n\nLet me walk you through the approach step by step:\n\n**First**, we need to understand the constraints. What are the hard requirements vs nice-to-haves?\n\n**Second**, let's look at existing patterns in the codebase. Consistency matters more than cleverness.\n\n**Third**, we prototype fast and iterate. Ship something small, learn from it, then improve.`,
  `That's an interesting challenge. Here's how I'd approach it:\n\nThe fundamental trade-off here is between **flexibility** and **simplicity**. Too much abstraction makes things hard to understand. Too little makes things hard to change.\n\nMy recommendation: start concrete, then abstract only when you see the pattern repeated three times. This is sometimes called the "Rule of Three."\n\nWant me to show you a concrete example?`,
  `Absolutely! Let me break this down:\n\n**The Problem:** You need a solution that scales but doesn't over-engineer things up front.\n\n**The Solution:** Use a layered architecture:\n- **Data layer** — handles persistence and queries\n- **Business logic** — pure functions, easy to test\n- **Presentation** — thin, delegates to business logic\n\nEach layer only talks to the one below it. This keeps dependencies clean and makes testing straightforward.`,
]

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const mockIndexRef = useRef(0)

  const {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    addMessage,
    updateMessage,
    resetMessage,
    deleteConversation,
  } = useConversations()

  /* ── Mock-stream AI response into a message ──────────── */
  const streamResponse = useCallback(
    async (
      convId: string,
      aiMsgId: string,
      _apiMessages: Array<{ role: string; content: string }>,
    ) => {
      setIsStreaming(true)
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      const responseText = MOCK_RESPONSES[mockIndexRef.current % MOCK_RESPONSES.length]
      mockIndexRef.current++

      const blocks: ContentBlock[] = []

      try {
        // Phase 1: Thinking (simulated)
        updateMessage(convId, aiMsgId, { status: 'streaming' })
        blocks.push({ type: 'thinking', content: '' })
        updateMessage(convId, aiMsgId, { blocks: [...blocks] })

        let thinkingContent = ''
        for (let i = 0; i < MOCK_THINKING.length; i += 4) {
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
          thinkingContent = MOCK_THINKING.slice(0, i + 4)
          blocks[0] = { type: 'thinking', content: thinkingContent }
          updateMessage(convId, aiMsgId, { blocks: [...blocks] })
          await delay(12)
        }

        // Thinking complete
        blocks[0] = { type: 'thinking', content: MOCK_THINKING, durationMs: 1840 }
        updateMessage(convId, aiMsgId, { blocks: [...blocks] })
        await delay(200)

        // Phase 2: Text streaming
        let textContent = ''
        for (let i = 0; i < responseText.length; i += 3) {
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
          textContent = responseText.slice(0, i + 3)
          updateMessage(convId, aiMsgId, { content: textContent })
          await delay(16)
        }

        updateMessage(convId, aiMsgId, {
          content: responseText,
          status: 'done',
          blocks: [...blocks],
        })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          updateMessage(convId, aiMsgId, { status: 'done' })
        } else {
          updateMessage(convId, aiMsgId, {
            status: 'error',
            content: err instanceof Error ? err.message : 'Something went wrong.',
          })
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [updateMessage],
  )

  /* ── Send a message ───────────────────────────────── */
  const handleSend = useCallback(
    async (text: string) => {
      let convId = activeId
      if (!convId) {
        const conv = createConversation()
        convId = conv.id
      }

      // Build API messages from current conversation
      const currentConv = conversations.find((c) => c.id === convId)
      const apiMessages = [
        ...(currentConv?.messages
          .filter((m) => m.status === 'done')
          .map((m) => ({ role: m.role, content: m.content })) ?? []),
        { role: 'user', content: text },
      ]

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: text,
        status: 'done',
        createdAt: Date.now(),
      }
      addMessage(convId, userMsg)

      const aiMsgId = uid()
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        blocks: [],
        status: 'pending',
        createdAt: Date.now(),
      }
      addMessage(convId, aiMsg)

      await streamResponse(convId, aiMsgId, apiMessages)
    },
    [activeId, conversations, createConversation, addMessage, streamResponse],
  )

  /* ── Regenerate an AI message ──────────────────────── */
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (!activeConversation || isStreaming) return
      const convId = activeConversation.id

      const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId)
      if (msgIndex < 0) return

      const apiMessages = activeConversation.messages
        .slice(0, msgIndex)
        .filter((m) => m.status === 'done')
        .map((m) => ({ role: m.role, content: m.content }))

      resetMessage(convId, messageId)
      await streamResponse(convId, messageId, apiMessages)
    },
    [activeConversation, isStreaming, resetMessage, streamResponse],
  )

  /* ── Stop generation ──────────────────────────────── */
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return (
    <div
      className="mesh-bg"
      style={{
        display: 'flex',
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onCreate={() => {
          const conv = createConversation()
          selectConversation(conv.id)
        }}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {/* Main chat panel */}
      <ChatPanel
        conversation={activeConversation}
        sidebarOpen={sidebarOpen}
        onSend={handleSend}
        onStop={handleStop}
        onRegenerate={handleRegenerate}
        isStreaming={isStreaming}
      />

      {/* Artifact panel placeholder (Phase 5) */}
      <AnimatePresence>
        {/* will render here */}
      </AnimatePresence>
    </div>
  )
}
