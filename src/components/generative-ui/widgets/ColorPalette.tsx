import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { shadows } from '../../../lib/theme'

interface ColorEntry { name: string; hex: string; role?: string }
interface ColorPaletteProps { colors: ColorEntry[] }

export default function ColorPalette({ colors }: ColorPaletteProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          letterSpacing: '0.06em',
          marginBottom: 10,
          color: '#000',
        }}
      >
        COLOR PALETTE
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
        {colors.map((c) => (
          <motion.button
            key={c.hex}
            whileHover={{ x: -2, y: -2, boxShadow: shadows.lg }}
            whileTap={{ x: 2, y: 2, boxShadow: 'none' }}
            transition={{ duration: 0.07 }}
            onClick={() => copy(c.hex)}
            style={{
              background: c.hex,
              border: '2px solid #000',
              boxShadow: shadows.sm,
              cursor: 'pointer',
              padding: 0,
              overflow: 'hidden',
              textAlign: 'left',
            }}
          >
            <div style={{ height: 56 }} />
            <div
              style={{
                padding: '6px 8px',
                background: '#fff',
                borderTop: '2px solid #000',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#000',
                  marginBottom: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied === c.hex ? <Check size={10} /> : null}
                {c.hex.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555' }}>
                {c.name}
              </div>
              {c.role && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#999' }}>
                  {c.role}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
