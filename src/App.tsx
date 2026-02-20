import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import './styles/globals.css'
import { useConversations } from './hooks/useConversations'
import Sidebar from './components/layout/Sidebar'
import ChatPanel from './components/layout/ChatPanel'
import type { Message } from './types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

  const {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    addMessage,
    updateMessage,
    deleteConversation,
  } = useConversations()

  /* ── Send a message ───────────────────────────────── */
  const handleSend = useCallback(
    async (text: string) => {
      // Ensure there's an active conversation
      let convId = activeId
      if (!convId) {
        const conv = createConversation()
        convId = conv.id
      }

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
        status: 'pending',
        createdAt: Date.now(),
      }
      addMessage(convId, aiMsg)
      setIsStreaming(true)

      // Simulate streaming response (Phase 3 will replace with real API)
      const DEMO = `I received your message: "${text}"\n\nThis is a demo response — real AI streaming will be wired up in Phase 3. The UI shell is fully functional: sidebar, message bubbles, scroll behavior, the input bar, and the empty state are all live.\n\nYou can send multiple messages and switch between conversations using the sidebar.`

      let i = 0
      updateMessage(convId, aiMsgId, { status: 'streaming' })

      const interval = setInterval(() => {
        i += 3
        updateMessage(convId!, aiMsgId, {
          content: DEMO.slice(0, i),
          status: i >= DEMO.length ? 'done' : 'streaming',
        })
        if (i >= DEMO.length) {
          clearInterval(interval)
          setIsStreaming(false)
        }
      }, 18)
    },
    [activeId, createConversation, addMessage, updateMessage]
  )

  const handleStop = useCallback(() => {
    setIsStreaming(false)
  }, [])

  /* ── Cmd+K new chat shortcut ──────────────────────── */
  // (handled in ChatPanel / InputBar for now)

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
        isStreaming={isStreaming}
      />

      {/* Artifact panel placeholder (Phase 5) */}
      <AnimatePresence>
        {/* will render here */}
      </AnimatePresence>
    </div>
  )
}
