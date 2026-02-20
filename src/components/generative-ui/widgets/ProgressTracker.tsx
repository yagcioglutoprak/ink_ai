import { useState } from 'react'
import { motion } from 'framer-motion'
import { springs, shadows } from '../../../lib/theme'

interface Step { label: string; done: boolean; detail?: string }
interface ProgressTrackerProps { steps: Step[]; title?: string; accentColor?: string }

export default function ProgressTracker({ steps: initial, title, accentColor = '#FFE500' }: ProgressTrackerProps) {
  const [steps, setSteps] = useState(initial)
  const done = steps.filter((s) => s.done).length

  const toggle = (i: number) =>
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, done: !s.done } : s))

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.06em', marginBottom: 10 }}>
          {title.toUpperCase()}
        </div>
      )}
      {/* Progress bar */}
      <div style={{ marginBottom: 12, border: '2px solid #000', height: 14, background: '#fff', position: 'relative', boxShadow: shadows.sm }}>
        <motion.div
          animate={{ width: `${(done / steps.length) * 100}%` }}
          transition={springs.smooth}
          style={{ height: '100%', background: accentColor, borderRight: done < steps.length ? '2px solid #000' : 'none' }}
        />
        <span
          style={{
            position: 'absolute',
            right: 6,
            top: 0,
            lineHeight: '10px',
            marginTop: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#555',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          {done}/{steps.length}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((step, i) => (
          <motion.button
            key={i}
            whileHover={{ x: -2, y: -2, boxShadow: shadows.md }}
            whileTap={{ x: 2, y: 2, boxShadow: 'none' }}
            transition={{ duration: 0.07 }}
            onClick={() => toggle(i)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              background: step.done ? accentColor : '#fff',
              border: '2px solid #000',
              boxShadow: shadows.sm,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* Step number / check */}
            <div
              style={{
                width: 22,
                height: 22,
                background: step.done ? '#000' : 'transparent',
                border: '2px solid #000',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: step.done ? accentColor : '#000',
                fontWeight: 500,
              }}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: '#000',
                  textDecoration: step.done ? 'line-through' : 'none',
                  fontWeight: step.done ? 400 : 500,
                }}
              >
                {step.label}
              </div>
              {step.detail && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#555', marginTop: 1 }}>
                  {step.detail}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
