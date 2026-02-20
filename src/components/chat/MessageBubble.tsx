import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { springs, shadows } from '../../lib/theme'
import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  accentColor?: string
  onRegenerate?: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, accentColor = '#FFE500', onRegenerate }: MessageBubbleProps) {
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

        {/* Bubble */}
        <motion.div
          whileHover={{ x: isUser ? 2 : -2, y: -2 }}
          transition={{ duration: 0.08 }}
          style={{
            padding: '14px 18px',
            background: isUser ? '#000' : '#FFFFFF',
            border: '2px solid #000',
            boxShadow: isUser ? shadows.md : shadows.sm,
            color: isUser ? '#FFE500' : '#0A0A0A',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.7,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            position: 'relative',
          }}
        >
          {/* Accent top bar for user messages */}
          {isUser && (
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

          {isPending && <PendingDots />}
          {!isPending && message.content}

          {/* Streaming cursor */}
          {isStreaming && message.content && (
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
        </motion.div>

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

          <ActionBtn onClick={handleCopy} title="Copy" accent={copied ? '#00CC44' : undefined}>
            {copied ? <Check size={10} /> : <Copy size={10} />}
          </ActionBtn>

          {!isUser && onRegenerate && (
            <ActionBtn onClick={onRegenerate} title="Regenerate">
              <RefreshCw size={10} />
            </ActionBtn>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ── AI avatar — brutalist square ────────────────────── */
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
        color: '#000',
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
