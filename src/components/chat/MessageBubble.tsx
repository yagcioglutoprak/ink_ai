import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, MoreHorizontal } from 'lucide-react'
import { springs } from '../../lib/theme'
import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  accentColor?: string
  onRegenerate?: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, accentColor = '#C8FF00', onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'
  const isPending = message.status === 'pending'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springs.bouncy}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 10,
        padding: '0 24px',
        marginBottom: 4,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <AIAvatar isAnimating={isStreaming || isPending} />
      )}

      {/* Bubble + actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '72%',
          gap: 4,
        }}
      >
        {/* The bubble */}
        <div
          style={{
            position: 'relative',
            padding: '13px 17px',
            borderRadius: isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            background: isUser ? '#0D0D12' : 'var(--color-surface)',
            border: isUser
              ? `2px solid ${accentColor}`
              : '1.5px solid var(--color-border)',
            boxShadow: isUser
              ? `0 0 16px ${accentColor}33, 0 2px 12px rgba(0,0,0,0.4)`
              : '0 2px 12px rgba(0,0,0,0.3)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.7,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {/* Streaming / pending dots */}
          {isPending && (
            <PendingDots />
          )}

          {!isPending && message.content}

          {/* Streaming cursor */}
          {isStreaming && message.content && (
            <span
              className="animate-cursor-blink"
              style={{
                display: 'inline-block',
                width: 9,
                height: 16,
                background: 'var(--color-neon-lime)',
                marginLeft: 3,
                verticalAlign: 'text-bottom',
                borderRadius: 1,
              }}
            />
          )}
        </div>

        {/* Timestamp + actions row */}
        <motion.div
          initial={false}
          animate={{ opacity: showActions ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          {/* Timestamp */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-faint)',
            }}
          >
            {formatTime(message.createdAt)}
          </span>

          {/* Copy */}
          <ActionBtn onClick={handleCopy} title="Copy">
            {copied ? <Check size={11} color="var(--color-neon-lime)" /> : <Copy size={11} />}
          </ActionBtn>

          {/* Regenerate (AI only) */}
          {!isUser && onRegenerate && (
            <ActionBtn onClick={onRegenerate} title="Regenerate">
              <RefreshCw size={11} />
            </ActionBtn>
          )}

          {/* More */}
          <ActionBtn onClick={() => {}} title="More">
            <MoreHorizontal size={11} />
          </ActionBtn>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ── AI avatar ────────────────────────────────────────── */
function AIAvatar({ isAnimating }: { isAnimating: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #B57BFF 0%, #4FC3F7 50%, #C8FF00 100%)',
        backgroundSize: '200% 200%',
        flexShrink: 0,
        border: '1.5px solid rgba(181,123,255,0.4)',
        boxShadow: '0 0 12px rgba(181,123,255,0.3)',
      }}
      className={isAnimating ? 'animate-gradient' : ''}
    />
  )
}

/* ── Three-dot pending ───────────────────────────────── */
function PendingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-bounce-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--color-muted)',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Small action button ─────────────────────────────── */
function ActionBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      transition={springs.quick}
      onClick={onClick}
      title={title}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        color: 'var(--color-muted)',
        cursor: 'pointer',
        padding: '3px 5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.12s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--color-text)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--color-muted)')}
    >
      {children}
    </motion.button>
  )
}
