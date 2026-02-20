import { useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import './styles/globals.css'
import { useConversations } from './hooks/useConversations'
import { streamChat } from './lib/api'
import Sidebar from './components/layout/Sidebar'
import ChatPanel from './components/layout/ChatPanel'
import type { Message, ContentBlock } from './types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

  /* ── Stream AI response into a message ───────────────── */
  const streamResponse = useCallback(
    async (
      convId: string,
      aiMsgId: string,
      apiMessages: Array<{ role: string; content: string }>,
    ) => {
      setIsStreaming(true)
      abortRef.current = new AbortController()
      updateMessage(convId, aiMsgId, { status: 'streaming' })

      let thinkingContent = ''
      let textContent = ''
      let blocks: ContentBlock[] = []

      try {
        for await (const event of streamChat(
          { messages: apiMessages },
          abortRef.current.signal,
        )) {
          switch (event.type) {
            case 'thinking_start':
              thinkingContent = ''
              blocks = [...blocks, { type: 'thinking', content: '' }]
              updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              break

            case 'thinking_delta':
              thinkingContent += event.content ?? ''
              blocks = blocks.map((b, i) =>
                i === blocks.length - 1 && b.type === 'thinking'
                  ? { ...b, content: thinkingContent }
                  : b,
              )
              updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              break

            case 'thinking_end':
              blocks = blocks.map((b, i) =>
                i === blocks.length - 1 && b.type === 'thinking'
                  ? { ...b, durationMs: event.durationMs }
                  : b,
              )
              updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              break

            case 'text_delta':
              textContent += event.content ?? ''
              updateMessage(convId, aiMsgId, { content: textContent })
              break

            case 'done':
              updateMessage(convId, aiMsgId, { status: 'done', blocks: [...blocks] })
              break

            case 'error':
              updateMessage(convId, aiMsgId, {
                status: 'error',
                content: event.error ?? 'An unexpected error occurred.',
              })
              break
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User stopped — mark as done with whatever content we have
          updateMessage(convId, aiMsgId, { status: 'done' })
        } else {
          updateMessage(convId, aiMsgId, {
            status: 'error',
            content: err instanceof Error ? err.message : 'Connection failed.',
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

      // Add user message
      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: text,
        status: 'done',
        createdAt: Date.now(),
      }
      addMessage(convId, userMsg)

      // Add AI pending message
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

      // Build API messages from messages before this one
      const apiMessages = activeConversation.messages
        .slice(0, msgIndex)
        .filter((m) => m.status === 'done')
        .map((m) => ({ role: m.role, content: m.content }))

      // Reset the AI message (clears content/blocks, removes messages after it)
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
