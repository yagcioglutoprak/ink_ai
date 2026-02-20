import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { springs } from '../../lib/theme'
import type { Message } from '../../types'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  accentColor?: string
  onRegenerate?: (messageId: string) => void
}

export default function MessageList({ messages, accentColor, onRegenerate }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showJump, setShowJump] = useState(false)

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  /* Detect if user has scrolled up */
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowJump(distFromBottom > 200)
  }

  const jumpToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'auto',
          paddingTop: 24,
          paddingBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              accentColor={accentColor}
              onRegenerate={
                msg.role === 'assistant' && onRegenerate
                  ? () => onRegenerate(msg.id)
                  : undefined
              }
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Jump to bottom FAB */}
      <AnimatePresence>
        {showJump && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.85 }}
            transition={springs.quick}
            onClick={jumpToBottom}
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#000',
              border: '2px solid #000',
              boxShadow: '3px 3px 0px #555',
              color: '#FFE500',
              cursor: 'pointer',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <ChevronDown size={12} />
            Jump to bottom
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
