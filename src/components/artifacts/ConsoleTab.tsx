import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { shadows } from '../../lib/theme'
import type { ConsoleEntry } from './PreviewTab'

interface ConsoleTabProps {
  entries: ConsoleEntry[]
  onClear: () => void
}

const LEVEL_CONFIG = {
  log:   { color: '#E0E0E0', bg: 'transparent', icon: null, label: 'LOG' },
  info:  { color: '#4FC3F7', bg: 'rgba(79,195,247,0.05)', icon: Info, label: 'INFO' },
  warn:  { color: '#FFB74D', bg: 'rgba(255,183,77,0.05)', icon: AlertTriangle, label: 'WARN' },
  error: { color: '#FF3B3B', bg: 'rgba(255,59,59,0.05)', icon: AlertCircle, label: 'ERR' },
} as const

export default function ConsoleTab({ entries, onClear }: ConsoleTabProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1A1A1A' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '2px solid #333',
          background: '#222',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: '#888',
          }}
        >
          CONSOLE {entries.length > 0 && `(${entries.length})`}
        </div>

        <motion.button
          whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
          whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
          transition={{ duration: 0.07 }}
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            background: 'transparent',
            border: '1.5px solid #555',
            color: '#888',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={9} />
          CLEAR
        </motion.button>
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#555',
              textAlign: 'center',
            }}
          >
            No console output yet.
          </div>
        ) : (
          entries.map((entry, i) => {
            const config = LEVEL_CONFIG[entry.level]
            const IconComponent = config.icon
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '4px 12px',
                  borderBottom: '1px solid #2A2A2A',
                  background: config.bg,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: config.color,
                }}
              >
                {/* Level indicator */}
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 40,
                    paddingTop: 1,
                  }}
                >
                  {IconComponent && <IconComponent size={10} />}
                  <span style={{ fontSize: 8, letterSpacing: '0.1em', opacity: 0.7 }}>
                    {config.label}
                  </span>
                </div>

                {/* Message */}
                <div style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {entry.args.join(' ')}
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: 8, color: '#555', flexShrink: 0, paddingTop: 2 }}>
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
