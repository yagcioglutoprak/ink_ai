import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, AlertCircle, Code2, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { springs, shadows } from '../../lib/theme'
import { langLabel, normaliseLang, isPreviewable } from '../../lib/artifacts'
import type { Message, GenerativeUIBlock, ThinkingBlock as ThinkingBlockType, ToolCallBlock as ToolCallBlockType } from '../../types'
import GenerativeUIRenderer from '../generative-ui/GenerativeUIRenderer'
import ThinkingBlock from './ThinkingBlock'
import ToolCallCard from './ToolCallCard'

interface MessageBubbleProps {
  message: Message
  accentColor?: string
  onRegenerate?: () => void
  onOpenArtifact?: (lang: string, code: string, title: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, accentColor = '#FFE500', onRegenerate, onOpenArtifact }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'
  const isPending = message.status === 'pending'
  const isError = message.status === 'error'

  // Extract blocks by type
  const thinkingBlocks = (message.blocks ?? []).filter(
    (b): b is ThinkingBlockType => b.type === 'thinking'
  )
  const toolCallBlocks = (message.blocks ?? []).filter(
    (b): b is ToolCallBlockType => b.type === 'tool_call'
  )
  const uiBlocks = (message.blocks ?? []).filter(
    (b): b is GenerativeUIBlock => b.type === 'generative_ui'
  )

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.bouncy}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: '0 24px',
        marginBottom: 2,
      }}
    >
      {/* Avatar */}
      {!isUser && <AIAvatar isAnimating={isStreaming || isPending} />}

      {/* Bubble + actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '72%',
          gap: 6,
        }}
      >
        {/* Label stamp */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#999',
            paddingLeft: isUser ? 0 : 2,
          }}
        >
          {isUser ? 'YOU' : 'INK.AI'}
        </div>

        {/* Thinking blocks (AI only, rendered before the bubble) */}
        {!isUser && thinkingBlocks.length > 0 && (
          <div style={{ width: '100%' }}>
            {thinkingBlocks.map((block, i) => (
              <ThinkingBlock
                key={i}
                block={block}
                isStreaming={isStreaming && !block.durationMs}
              />
            ))}
          </div>
        )}

        {/* Tool call cards (rendered before the bubble) */}
        {!isUser && toolCallBlocks.length > 0 && (
          <div style={{ width: '100%' }}>
            {toolCallBlocks.map((block) => (
              <ToolCallCard key={block.id} block={block} />
            ))}
          </div>
        )}

        {/* Bubble */}
        <motion.div
          whileHover={{ x: isUser ? 2 : -2, y: -2 }}
          transition={{ duration: 0.08 }}
          style={{
            padding: '14px 18px',
            background: isError
              ? '#FFF0F0'
              : isUser
                ? '#000'
                : '#FFFFFF',
            border: isError ? '2px solid #FF3B3B' : '2px solid #000',
            boxShadow: isError ? '3px 3px 0px #FF3B3B' : isUser ? shadows.md : shadows.sm,
            color: isError
              ? '#CC0000'
              : isUser
                ? '#FFE500'
                : '#0A0A0A',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.7,
            wordBreak: 'break-word',
            whiteSpace: isUser ? 'pre-wrap' : undefined,
            position: 'relative',
          }}
        >
          {/* Accent top bar for user messages */}
          {isUser && !isError && (
            <div
              style={{
                position: 'absolute',
                top: -6,
                right: 12,
                width: 20,
                height: 4,
                background: accentColor,
                border: '1px solid #000',
              }}
            />
          )}

          {/* Pending state */}
          {isPending && <PendingDots />}

          {/* Error state */}
          {isError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 3 }} />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  ERROR
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                  {message.content || 'Something went wrong.'}
                </div>
              </div>
            </div>
          )}

          {/* Normal content */}
          {!isPending && !isError && message.content && (
            isUser ? (
              message.content
            ) : (
              <div className="md-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={onOpenArtifact ? {
                    pre({ children }) {
                      return <>{children}</>
                    },
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className ?? '')
                      const lang = match?.[1] ?? ''
                      const codeStr = String(children).replace(/\n$/, '')

                      if (!match || codeStr.length < 10) {
                        return <code className={className}>{children}</code>
                      }

                      const normLang = normaliseLang(lang)
                      const label = langLabel(normLang)
                      const preview = isPreviewable(normLang)
                      const title = `${label} snippet`

                      return (
                        <ArtifactCard
                          label={label}
                          preview={preview}
                          onOpen={() => onOpenArtifact(lang, codeStr, title)}
                        />
                      )
                    },
                  } : undefined}
                >
                  {message.content}
                </ReactMarkdown>
                {/* Streaming cursor */}
                {isStreaming && (
                  <span
                    className="animate-cursor-blink"
                    style={{
                      display: 'inline-block',
                      width: 9,
                      height: '1em',
                      background: '#FFE500',
                      marginLeft: 3,
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </div>
            )
          )}
        </motion.div>

        {/* Generative UI blocks */}
        {uiBlocks.length > 0 && (
          <div style={{ width: '100%' }}>
            {uiBlocks.map((block, i) => (
              <GenerativeUIRenderer key={i} block={block} accentColor={accentColor} />
            ))}
          </div>
        )}

        {/* Actions row */}
        <motion.div
          animate={{ opacity: showActions ? 1 : 0 }}
          transition={{ duration: 0.12 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#aaa', letterSpacing: '0.08em' }}>
            {formatTime(message.createdAt)}
          </span>

          {!isError && (
            <ActionBtn onClick={handleCopy} title="Copy" accent={copied ? '#00CC44' : undefined}>
              {copied ? <Check size={10} /> : <Copy size={10} />}
            </ActionBtn>
          )}

          {!isUser && onRegenerate && (
            <ActionBtn
              onClick={onRegenerate}
              title={isError ? 'Retry' : 'Regenerate'}
              accent={isError ? '#FF3B3B' : undefined}
            >
              <RefreshCw size={10} />
            </ActionBtn>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ── Artifact card (replaces inline code block) ──────── */
function ArtifactCard({
  label,
  preview,
  onOpen,
}: {
  label: string
  preview: boolean
  onOpen: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        margin: '8px 0',
        padding: '8px 12px',
        background: '#0A0A0A',
        border: '2px solid #000',
        boxShadow: '3px 3px 0 #FFE500',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Code2 size={13} color="#FFE500" />
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#FFE500',
              letterSpacing: '0.08em',
              fontWeight: 500,
            }}
          >
            {label.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#666',
              letterSpacing: '0.06em',
              marginTop: 1,
            }}
          >
            {preview ? 'LIVE PREVIEW AVAILABLE' : 'CODE ARTIFACT'}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ x: -1, y: -1, boxShadow: '3px 3px 0 #000' }}
        whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
        transition={{ duration: 0.07 }}
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 12px',
          background: '#FFE500',
          border: '1.5px solid #000',
          color: '#000',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          fontWeight: 500,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {preview ? <Eye size={10} /> : <Code2 size={10} />}
        OPEN
      </motion.button>
    </motion.div>
  )
}

/* ── AI avatar — brutalist square ──────────────────���─── */
function AIAvatar({ isAnimating }: { isAnimating: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        background: isAnimating ? '#FFE500' : '#000',
        border: '2px solid #000',
        boxShadow: '2px 2px 0px #000',
        flexShrink: 0,
        transition: 'background 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        fontWeight: 400,
        color: isAnimating ? '#000' : '#FFE500',
        letterSpacing: '0.05em',
      }}
    >
      AI
    </div>
  )
}

/* ── Pending dots ─────────────────────────────────────── */
function PendingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-bounce-dot"
          style={{
            width: 6,
            height: 6,
            background: '#555',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Action button ────────────────────────────────────── */
function ActionBtn({
  children,
  onClick,
  title,
  accent,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  accent?: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={springs.quick}
      onClick={onClick}
      title={title}
      style={{
        background: accent ?? 'transparent',
        border: '1.5px solid #000',
        color: accent ? '#fff' : '#000',
        cursor: 'pointer',
        padding: '2px 5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </motion.button>
  )
}
