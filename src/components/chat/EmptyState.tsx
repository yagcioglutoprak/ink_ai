import { motion } from 'framer-motion'
import { springs, stagger } from '../../lib/theme'

const SUGGESTIONS = [
  { label: 'Build a landing page', color: '#C8FF00' },
  { label: 'Explain async/await', color: '#4FC3F7' },
  { label: 'Refactor my code', color: '#B57BFF' },
  { label: 'Write unit tests', color: '#FF4F5E' },
  { label: 'Design a REST API', color: '#FFB547' },
  { label: 'Debug this error', color: '#C8FF00' },
]

const ORBS = [
  { size: 180, x: '8%',  y: '15%', color: '#C8FF00', delay: 0,    dur: 7 },
  { size: 140, x: '75%', y: '10%', color: '#B57BFF', delay: 1.2,  dur: 9 },
  { size: 100, x: '85%', y: '65%', color: '#4FC3F7', delay: 0.5,  dur: 8 },
  { size: 120, x: '5%',  y: '70%', color: '#FF4F5E', delay: 2,    dur: 6 },
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
        padding: '40px 24px',
      }}
    >
      {/* Floating orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -14, 0], rotate: [0, 3, -2, 0] }}
          transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${orb.color}22 0%, transparent 70%)`,
            border: `1px solid ${orb.color}18`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520 }}>

        {/* AI avatar orb */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springs.bouncy, delay: 0.1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #B57BFF 0%, #4FC3F7 50%, #C8FF00 100%)',
            backgroundSize: '200% 200%',
            margin: '0 auto 28px',
            border: '2px solid rgba(181,123,255,0.5)',
            boxShadow: '0 0 40px rgba(181,123,255,0.3), 0 0 80px rgba(79,195,247,0.15)',
          }}
          className="animate-gradient"
        />

        {/* Heading */}
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.18 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #F0F0F8 30%, #8888A0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          What can I help with?
        </motion.h1>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springs.smooth, delay: 0.24 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-muted)',
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          Ask anything, build something, explore ideas.
          <br />
          I think, search the web, and write code.
        </motion.p>

        {/* Suggestion chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...springs.bouncy, delay: 0.32 + i * stagger.fast }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSuggestion(s.label)}
              style={{
                padding: '9px 16px',
                background: `${s.color}0D`,
                border: `1.5px solid ${s.color}33`,
                borderRadius: 'var(--radius-bubble)',
                color: s.color,
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${s.color}44`
                ;(e.currentTarget as HTMLElement).style.borderColor = `${s.color}66`
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLElement).style.borderColor = `${s.color}33`
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
