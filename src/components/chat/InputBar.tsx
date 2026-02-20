import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Square, Globe, Paperclip } from 'lucide-react'
import { shadows } from '../../lib/theme'

interface InputBarProps {
  onSend: (text: string, options?: { webSearch?: boolean }) => void
  isStreaming: boolean
  onStop: () => void
  disabled?: boolean
}

export default function InputBar({ onSend, isStreaming, onStop, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

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
    onSend(trimmed, { webSearch })
    setValue('')
  }, [value, isStreaming, disabled, onSend, webSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>

      {/* Web search badge */}
      <AnimatePresence>
        {webSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#0055FF',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <Globe size={10} />
            WEB SEARCH ON
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input box */}
      <div
        style={{
          background: '#fff',
          border: focused ? '3px solid #000' : '2px solid #000',
          boxShadow: focused ? shadows.xl : shadows.md,
          transition: 'box-shadow 0.1s, border 0.1s',
          position: 'relative',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="TYPE YOUR MESSAGE..."
          disabled={disabled}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '14px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#000',
            caretColor: '#000',
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
            padding: '6px 10px 10px',
            borderTop: '2px solid #000',
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconBtn title="Attach" onClick={() => {}}>
              <Paperclip size={13} />
            </IconBtn>

            <motion.button
              whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
              whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
              transition={{ duration: 0.07 }}
              onClick={() => setWebSearch((v) => !v)}
              style={{
                background: webSearch ? '#0055FF' : 'transparent',
                border: '1.5px solid #000',
                color: webSearch ? '#fff' : '#000',
                cursor: 'pointer',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: 'none',
              }}
            >
              <Globe size={10} />
              SEARCH
            </motion.button>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: '#999',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {isStreaming ? '' : '↵ SEND'}
            </span>

            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
                  whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
                  transition={{ duration: 0.07 }}
                  onClick={onStop}
                  style={{
                    width: 36,
                    height: 36,
                    background: '#FF3B3B',
                    border: '2px solid #000',
                    boxShadow: shadows.sm,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Square size={13} fill="currentColor" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={canSend ? { x: -1, y: -1, boxShadow: shadows.md } : {}}
                  whileTap={canSend ? { x: 1, y: 1, boxShadow: 'none' } : {}}
                  transition={{ duration: 0.07 }}
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    width: 36,
                    height: 36,
                    background: canSend ? '#000' : '#ccc',
                    border: '2px solid #000',
                    boxShadow: canSend ? shadows.sm : 'none',
                    color: canSend ? '#FFE500' : '#888',
                    cursor: canSend ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.1s',
                  }}
                >
                  <ArrowUp size={15} strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
      whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
      transition={{ duration: 0.07 }}
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: '1.5px solid #000',
        color: '#000',
        cursor: 'pointer',
        padding: '4px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
      }}
    >
      {children}
    </motion.button>
  )
}
