import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './styles/globals.css'
import { useConversations } from './hooks/useConversations'
import { useArtifacts } from './hooks/useArtifacts'
import { streamChat } from './lib/api'
import { normaliseLang, isPreviewable, langLabel } from './lib/artifacts'
import Sidebar from './components/layout/Sidebar'
import ChatPanel from './components/layout/ChatPanel'
import ArtifactPanel from './components/layout/ArtifactPanel'
import type { Message, ContentBlock, ToolCallBlock, GenerativeUIBlock } from './types'

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
    activeArtifact,
    panelOpen,
    addArtifact,
    updateArtifactCode,
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
      let streamingArtifactId: string | null = null

      try {
        updateMessage(convId, aiMsgId, { status: 'streaming' })

        for await (const event of streamChat(
          {
            messages: apiMessages,
            tools: enableTools,
            conversationId: convId,
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

            case 'text_delta': {
              fullText += event.content ?? ''
              updateMessage(convId, aiMsgId, { content: fullText })

              // ── Live artifact streaming ──────────────────
              // Detect code fences (open or closed) and push code to the artifact panel
              const fenceStart = fullText.match(/```(\w+)[^\n]*\n/)
              if (fenceStart) {
                const lang = fenceStart[1]
                const normLang = normaliseLang(lang)
                if (isPreviewable(normLang)) {
                  const codeStartIdx = fullText.indexOf(fenceStart[0]) + fenceStart[0].length
                  // Find closing fence if it exists
                  const closingIdx = fullText.indexOf('\n```', codeStartIdx)
                  const liveCode = closingIdx >= 0
                    ? fullText.slice(codeStartIdx, closingIdx)
                    : fullText.slice(codeStartIdx)

                  if (liveCode.length >= 5) {
                    if (!streamingArtifactId) {
                      // Open artifact panel with initial code
                      const label = langLabel(normLang)
                      const artId = `artifact-stream-${Date.now()}-${Math.random().toString(36).slice(2)}`
                      streamingArtifactId = artId
                      addArtifact({
                        id: artId,
                        conversationId: convId,
                        messageId: aiMsgId,
                        type: normLang,
                        title: `${label} snippet`,
                        code: liveCode,
                        version: 1,
                        createdAt: Date.now(),
                      })
                    } else {
                      // Push incremental update
                      updateArtifactCode(streamingArtifactId, liveCode)
                    }
                  }
                }
              }
              break
            }

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

            // ── Real-time render_ui streaming ────────────
            case 'render_ui_delta': {
              const partialArgs = event.partialArgs ?? ''

              // Try to parse the accumulated args
              let parsed: Record<string, unknown> = {}
              let mode = ''
              let partialCode = ''
              let caption = ''
              let widgetType = ''
              let widgetProps: Record<string, unknown> | undefined

              try {
                parsed = JSON.parse(partialArgs)
                mode = (parsed.mode as string) ?? ''
                partialCode = (parsed.code as string) ?? ''
                caption = (parsed.caption as string) ?? ''
                widgetType = (parsed.widget_type as string) ?? ''
                widgetProps = parsed.props as Record<string, unknown> | undefined
              } catch {
                // Partial JSON — extract via regex
                const modeMatch = partialArgs.match(/"mode"\s*:\s*"([^"]*)"/)
                mode = modeMatch?.[1] ?? ''
                const captionMatch = partialArgs.match(/"caption"\s*:\s*"([^"]*)"/)
                caption = captionMatch?.[1] ?? ''
                const wtMatch = partialArgs.match(/"widget_type"\s*:\s*"([^"]*)"/)
                widgetType = wtMatch?.[1] ?? ''

                // Extract partial code for generated mode
                const codeStart = partialArgs.indexOf('"code":"')
                if (codeStart !== -1) {
                  let raw = partialArgs.slice(codeStart + 8)
                  if (raw.endsWith('}')) raw = raw.slice(0, -1)
                  if (raw.endsWith('"')) raw = raw.slice(0, -1)
                  try {
                    partialCode = JSON.parse('"' + raw + '"')
                  } catch {
                    partialCode = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
                  }
                }
              }

              // Update the ToolCallBlock's args so tool_call_result can read them
              const tcForArgs = blocks.find(
                (b): b is ToolCallBlock => b.type === 'tool_call' && b.id === event.id,
              )
              if (tcForArgs) {
                tcForArgs.args = Object.keys(parsed).length > 0
                  ? parsed
                  : { mode, code: partialCode, caption, widget_type: widgetType }
              }

              // For generated mode: show live code preview
              if (mode === 'generated' && partialCode) {
                const existingIdx = blocks.findIndex(
                  (b) => b.type === 'generative_ui' && (b as GenerativeUIBlock).mode === 'generated'
                    && (b as { _streamId?: string })._streamId === event.id
                )
                const uiBlock: GenerativeUIBlock & { _streamId?: string } = {
                  type: 'generative_ui',
                  mode: 'generated',
                  code: partialCode,
                  caption: caption || 'Generating...',
                  _streamId: event.id,
                }
                if (existingIdx >= 0) {
                  blocks[existingIdx] = uiBlock
                } else {
                  blocks.push(uiBlock)
                }
              }

              // For widget mode: show widget as soon as we have type + props
              if (mode === 'widget' && widgetType && widgetProps) {
                const existingIdx = blocks.findIndex(
                  (b) => b.type === 'generative_ui' && (b as GenerativeUIBlock).mode === 'widget'
                    && (b as { _streamId?: string })._streamId === event.id
                )
                const uiBlock: GenerativeUIBlock & { _streamId?: string } = {
                  type: 'generative_ui',
                  mode: 'widget',
                  widgetType,
                  props: widgetProps,
                  caption,
                  _streamId: event.id,
                }
                if (existingIdx >= 0) {
                  blocks[existingIdx] = uiBlock
                } else {
                  blocks.push(uiBlock)
                }
              }

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

                // Convert render_ui tool calls into GenerativeUIBlocks
                if (tc.toolName === 'render_ui') {
                  const args = tc.args as {
                    mode?: string
                    widget_type?: string
                    props?: Record<string, unknown>
                    code?: string
                    caption?: string
                  }

                  // Check if render_ui_delta already created one
                  const existingStreamIdx = blocks.findIndex(
                    (b) => b.type === 'generative_ui'
                      && (b as { _streamId?: string })._streamId === tc.id
                  )

                  const uiBlock: GenerativeUIBlock =
                    args.mode === 'generated' && args.code
                      ? {
                        type: 'generative_ui',
                        mode: 'generated',
                        code: args.code,
                        caption: args.caption,
                      }
                      : {
                        type: 'generative_ui',
                        mode: 'widget',
                        widgetType: args.widget_type,
                        props: args.props,
                        caption: args.caption,
                      }

                  if (existingStreamIdx >= 0) {
                    blocks[existingStreamIdx] = uiBlock
                  } else {
                    blocks.push(uiBlock)
                  }
                }

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
            case 'done': {
              updateMessage(convId, aiMsgId, {
                content: fullText,
                status: 'done',
                blocks: [...blocks],
              })

              // Final artifact sync — ensure panel has the complete code
              if (streamingArtifactId) {
                const fenceStart = fullText.match(/```(\w+)[^\n]*\n/)
                if (fenceStart) {
                  const codeStartIdx = fullText.indexOf(fenceStart[0]) + fenceStart[0].length
                  const closingIdx = fullText.indexOf('\n```', codeStartIdx)
                  const finalCode = closingIdx >= 0
                    ? fullText.slice(codeStartIdx, closingIdx)
                    : fullText.slice(codeStartIdx)
                  updateArtifactCode(streamingArtifactId, finalCode.trimEnd())
                }
              }
              break
            }

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
    [updateMessage, addArtifact, updateArtifactCode],
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
            isStreaming={isStreaming}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
