import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Square, Globe, Paperclip } from 'lucide-react'
import { springs } from '../../lib/theme'

interface InputBarProps {
  onSend: (text: string) => void
  isStreaming: boolean
  onStop: () => void
  disabled?: boolean
}

export default function InputBar({ onSend, isStreaming, onStop, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  /* Cmd+/ focus shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setValue('')
  }, [value, isStreaming, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      style={{
        padding: '0 24px 20px',
        flexShrink: 0,
      }}
    >
      {/* Web search indicator */}
      <AnimatePresence>
        {webSearch && (
          <motion.div
            initial={{ opacity: 0, y: 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 6, height: 0 }}
            style={{
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-blue)',
            }}
          >
            <Globe size={11} />
            Web search enabled
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <motion.div
        animate={{
          boxShadow: focused
            ? '0 0 0 2px var(--color-neon-lime), 0 0 24px rgba(200,255,0,0.15)'
            : '0 0 0 1.5px var(--color-border)',
        }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-bubble)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Message ink.ai…"
          disabled={disabled}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '16px 56px 16px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--color-text)',
            caretColor: 'var(--color-neon-lime)',
            overflowY: 'auto',
            maxHeight: 200,
          }}
        />

        {/* Bottom toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px 12px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Left actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Attach */}
            <IconBtn title="Attach file" onClick={() => {}}>
              <Paperclip size={14} />
            </IconBtn>

            {/* Web search toggle */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              transition={springs.quick}
              onClick={() => setWebSearch((v) => !v)}
              title="Toggle web search"
              style={{
                background: webSearch ? 'rgba(79,195,247,0.15)' : 'transparent',
                border: webSearch ? '1px solid rgba(79,195,247,0.4)' : '1px solid transparent',
                borderRadius: 'var(--radius-xs)',
                color: webSearch ? 'var(--color-blue)' : 'var(--color-muted)',
                cursor: 'pointer',
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                transition: 'all 0.15s',
              }}
            >
              <Globe size={12} />
              Search
            </motion.button>
          </div>

          {/* Right: keyboard hint + send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-faint)',
              }}
            >
              {isStreaming ? '' : '⏎ send · ⇧⏎ newline'}
            </span>

            {/* Send / Stop button */}
            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={springs.quick}
                  whileTap={{ scale: 0.9 }}
                  onClick={onStop}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--color-coral)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 14px rgba(255,79,94,0.5)',
                  }}
                >
                  <Square size={13} fill="currentColor" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={springs.quick}
                  whileHover={canSend ? { scale: 1.08 } : {}}
                  whileTap={canSend ? { scale: 0.92 } : {}}
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: canSend ? 'var(--color-neon-lime)' : 'var(--color-border)',
                    border: 'none',
                    color: canSend ? '#0D0D12' : 'var(--color-faint)',
                    cursor: canSend ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: canSend ? '0 0 14px rgba(200,255,0,0.4)' : 'none',
                    transition: 'background 0.15s, box-shadow 0.15s, color 0.15s',
                  }}
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Small icon button ───────────────────────────────── */
function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={springs.quick}
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-xs)',
        color: 'var(--color-muted)',
        cursor: 'pointer',
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text)'
        ;(e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'
        ;(e.currentTarget as HTMLElement).style.background = 'none'
      }}
    >
      {children}
    </motion.button>
  )
}
