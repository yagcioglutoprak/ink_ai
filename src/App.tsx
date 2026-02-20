import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './styles/globals.css'
import { useConversations } from './hooks/useConversations'
import { useArtifacts } from './hooks/useArtifacts'
import { streamChat } from './lib/api'
import { normaliseLang } from './lib/artifacts'
import Sidebar from './components/layout/Sidebar'
import ChatPanel from './components/layout/ChatPanel'
import ArtifactPanel from './components/layout/ArtifactPanel'
import type { Message, ContentBlock, ToolCallBlock } from './types'

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

  const {
    artifacts,
    activeArtifact,
    panelOpen,
    addArtifact,
    selectArtifact,
    closePanel: closeArtifactPanel,
    getConversationArtifacts,
  } = useArtifacts()

  /* ── Stream AI response via /api/chat SSE ────────────── */
  const streamResponse = useCallback(
    async (
      convId: string,
      aiMsgId: string,
      apiMessages: Array<{ role: string; content: string }>,
      enableTools: boolean,
    ) => {
      setIsStreaming(true)
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      const blocks: ContentBlock[] = []
      let fullText = ''

      try {
        updateMessage(convId, aiMsgId, { status: 'streaming' })

        for await (const event of streamChat(
          {
            messages: apiMessages,
            tools: enableTools,
          },
          signal,
        )) {
          switch (event.type) {
            // ── Thinking ──────────────────────────────
            case 'thinking_start':
              blocks.push({ type: 'thinking', content: '' })
              updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              break

            case 'thinking_delta': {
              const tb = blocks.findLast((b) => b.type === 'thinking')
              if (tb && tb.type === 'thinking') {
                tb.content += event.content ?? ''
                updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              }
              break
            }

            case 'thinking_end': {
              const tb = blocks.findLast((b) => b.type === 'thinking')
              if (tb && tb.type === 'thinking') {
                tb.durationMs = event.durationMs
                updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              }
              break
            }

            // ── Text ──────────────────────────────────
            case 'text_start':
              break

            case 'text_delta':
              fullText += event.content ?? ''
              updateMessage(convId, aiMsgId, { content: fullText })
              break

            case 'text_end':
              break

            // ── Tool calls ────────────────────────────
            case 'tool_call_start': {
              const tcBlock: ToolCallBlock = {
                type: 'tool_call',
                id: event.id!,
                toolName: event.toolName!,
                args: event.args ?? {},
                status: 'running',
              }
              blocks.push(tcBlock)
              updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              break
            }

            case 'tool_call_result': {
              const tc = blocks.find(
                (b): b is ToolCallBlock => b.type === 'tool_call' && b.id === event.id,
              )
              if (tc) {
                tc.status = 'success'
                tc.result = event.result as ToolCallBlock['result']
                tc.durationMs = event.durationMs
                updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              }
              break
            }

            case 'tool_call_error': {
              const tc = blocks.find(
                (b): b is ToolCallBlock => b.type === 'tool_call' && b.id === event.id,
              )
              if (tc) {
                tc.status = 'error'
                tc.error = event.error
                tc.durationMs = event.durationMs
                updateMessage(convId, aiMsgId, { blocks: [...blocks] })
              }
              break
            }

            // ── Done / Error ──────────────────────────
            case 'done':
              updateMessage(convId, aiMsgId, {
                content: fullText,
                status: 'done',
                blocks: [...blocks],
              })
              break

            case 'error':
              updateMessage(convId, aiMsgId, {
                status: 'error',
                content: event.error ?? 'Something went wrong.',
              })
              break
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          updateMessage(convId, aiMsgId, { status: 'done', content: fullText })
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
    async (text: string, options?: { webSearch?: boolean }) => {
      let convId = activeId
      if (!convId) {
        const conv = createConversation()
        convId = conv.id
      }

      const enableTools = options?.webSearch ?? false

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

      await streamResponse(convId, aiMsgId, apiMessages, enableTools)
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
      await streamResponse(convId, messageId, apiMessages, false)
    },
    [activeConversation, isStreaming, resetMessage, streamResponse],
  )

  /* ── Stop generation ──────────────────────────────── */
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  /* ── Open a code block as an artifact ─────────────── */
  const handleOpenArtifact = useCallback(
    (lang: string, code: string, title: string) => {
      const convId = activeId ?? 'unknown'
      addArtifact({
        id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversationId: convId,
        messageId: '',
        type: normaliseLang(lang),
        title,
        code,
        version: 1,
        createdAt: Date.now(),
      })
    },
    [activeId, addArtifact],
  )

  /* ── Cmd+K / Ctrl+K → new chat ─────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const conv = createConversation()
        selectConversation(conv.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createConversation, selectConversation])

  const conversationArtifacts = activeId ? getConversationArtifacts(activeId) : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
        onOpenArtifact={handleOpenArtifact}
        isStreaming={isStreaming}
      />

      {/* Artifact panel (right side drawer) */}
      <AnimatePresence>
        {panelOpen && activeArtifact && (
          <ArtifactPanel
            artifact={activeArtifact}
            allArtifacts={conversationArtifacts}
            onClose={closeArtifactPanel}
            onSelectArtifact={selectArtifact}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
