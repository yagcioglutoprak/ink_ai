import { motion } from 'framer-motion'
import { springs, stagger, shadows } from '../../lib/theme'

const SUGGESTIONS = [
  { label: 'BUILD A LANDING PAGE', color: '#FFE500' },
  { label: 'EXPLAIN ASYNC/AWAIT',  color: '#0055FF' },
  { label: 'REFACTOR MY CODE',     color: '#FF3B3B' },
  { label: 'WRITE UNIT TESTS',     color: '#00CC44' },
  { label: 'DESIGN A REST API',    color: '#FF2D78' },
  { label: 'DEBUG THIS ERROR',     color: '#FFE500' },
]

interface EmptyStateProps {
  onSuggestion: (text: string) => void
}

export default function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 32px',
        background: '#FFFCF0',
      }}
    >
      {/* Grid background lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560 }}>

        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springs.bouncy, delay: 0.05 }}
          style={{
            width: 80,
            height: 80,
            background: '#FFE500',
            border: '3px solid #000',
            boxShadow: shadows.lg,
            margin: '0 auto 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 400,
            color: '#000',
            letterSpacing: '0.05em',
          }}
        >
          AI
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.12 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 64,
            fontWeight: 400,
            letterSpacing: '0.04em',
            lineHeight: 0.95,
            marginBottom: 16,
            color: '#000',
          }}
        >
          WHAT CAN
          <br />
          I HELP WITH?
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ ...springs.smooth, delay: 0.2 }}
          style={{
            height: 3,
            background: '#000',
            marginBottom: 20,
            transformOrigin: 'left',
          }}
        />

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.22 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: '#555',
            lineHeight: 1.7,
            marginBottom: 36,
            letterSpacing: '0.02em',
          }}
        >
          Ask anything. Build something. I think, search the web, and write code.
        </motion.p>

        {/* Suggestion chips */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.bouncy, delay: 0.28 + i * stagger.fast }}
              whileHover={{ x: -2, y: -2, boxShadow: shadows.md }}
              whileTap={{ x: 2, y: 2, boxShadow: 'none' }}
              onClick={() => onSuggestion(s.label)}
              style={{
                padding: '9px 14px',
                background: s.color,
                border: '2px solid #000',
                boxShadow: shadows.sm,
                color: '#000',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'box-shadow 0.07s',
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
