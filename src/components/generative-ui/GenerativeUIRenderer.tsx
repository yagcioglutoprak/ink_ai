import { motion } from 'framer-motion'
import { springs, shadows } from '../../lib/theme'
import { widgetRegistry } from '../../lib/widgetRegistry'
import GeneratedComponent from './GeneratedComponent'
import type { GenerativeUIBlock } from '../../types'

interface GenerativeUIRendererProps {
  block: GenerativeUIBlock
  accentColor?: string
}

export default function GenerativeUIRenderer({ block, accentColor }: GenerativeUIRendererProps) {
  /* ── Mode: pre-built catalogue widget ─────────────────── */
  if (block.mode === 'widget') {
    const Widget = block.widgetType ? widgetRegistry[block.widgetType] : null

    if (!Widget) {
      return (
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            border: '2px solid #FF3B3B',
            background: '#fff',
            boxShadow: '3px 3px 0 #FF3B3B',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: '#FF3B3B',
          }}
        >
          UNKNOWN WIDGET: {block.widgetType}
        </div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springs.bouncy}
        style={{ marginTop: 8, width: '100%' }}
      >
        {/* Caption + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          {block.caption && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#555' }}>
              {block.caption}
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#000',
              background: accentColor ?? '#FFE500',
              padding: '2px 6px',
              border: '1px solid #000',
              marginLeft: 'auto',
            }}
          >
            WIDGET
          </span>
        </div>

        {/* Widget container */}
        <div
          style={{
            border: '2px solid #000',
            boxShadow: shadows.md,
            background: '#FFFCF0',
            padding: 16,
          }}
        >
          <Widget {...(block.props ?? {})} accentColor={accentColor} />
        </div>
      </motion.div>
    )
  }

  /* ── Mode: AI-generated JSX sandbox ────────────────────── */
  if (block.mode === 'generated' && block.code) {
    return (
      <GeneratedComponent
        code={block.code}
        caption={block.caption}
      />
    )
  }

  return null
}
