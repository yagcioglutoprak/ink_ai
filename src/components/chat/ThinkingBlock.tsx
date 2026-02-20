import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import { springs, shadows } from '../../lib/theme'
import type { ThinkingBlock as ThinkingBlockType } from '../../types'

interface ThinkingBlockProps {
  block: ThinkingBlockType
  isStreaming?: boolean
}

export default function ThinkingBlock({ block, isStreaming }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(!!isStreaming)
  const wasStreaming = useRef(isStreaming)

  // Auto-open when thinking starts, auto-close when thinking finishes
  useEffect(() => {
    if (isStreaming && !wasStreaming.current) {
      setExpanded(true)
    }
    if (!isStreaming && wasStreaming.current) {
      setExpanded(false)
    }
    wasStreaming.current = isStreaming
  }, [isStreaming])

  const durationLabel = block.durationMs
    ? block.durationMs >= 1000
      ? `${(block.durationMs / 1000).toFixed(1)}s`
      : `${block.durationMs}ms`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.bouncy}
      style={{
        marginBottom: 8,
        border: '2px solid #000',
        boxShadow: shadows.sm,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: '#7B2FFF',
          border: 'none',
          borderBottom: expanded ? '2px solid #000' : 'none',
          cursor: 'pointer',
          color: '#fff',
        }}
      >
        <div className={isStreaming ? 'animate-brain-pulse' : ''}>
          <Brain size={14} />
        </div>

        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            letterSpacing: '0.08em',
          }}
        >
          {isStreaming ? 'THINKING...' : 'THOUGHT PROCESS'}
        </span>

        {durationLabel && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              opacity: 0.8,
              marginLeft: 'auto',
              marginRight: 4,
            }}
          >
            {durationLabel}
          </span>
        )}

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown size={12} />
        </motion.div>
      </button>

      {/* ── Content ────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.smooth}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '10px 14px',
                background: '#F5EEFF',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.8,
                color: '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {block.content || (isStreaming ? '' : 'No thinking content.')}

              {isStreaming && (
                <span
                  className="animate-cursor-blink"
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: '1em',
                    background: '#7B2FFF',
                    marginLeft: 2,
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
