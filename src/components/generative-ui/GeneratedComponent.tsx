import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { springs, shadows } from '../../lib/theme'
import { buildSandboxHTML } from '../../lib/sandboxTemplate'

interface GeneratedComponentProps {
  code: string
  caption?: string
}

export default function GeneratedComponent({ code, caption }: GeneratedComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(120)
  const [loading, setLoading] = useState(true)
  const srcDoc = buildSandboxHTML(code)

  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === 'sandbox-resize' && typeof e.data.height === 'number') {
      setHeight(Math.max(60, e.data.height))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Fallback: stop loading indicator after timeout
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springs.bouncy}
      style={{ marginTop: 8, width: '100%' }}
    >
      {/* Caption + badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        {caption && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#555',
              letterSpacing: '0.05em',
            }}
          >
            {caption}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#fff',
            background: '#000',
            padding: '2px 6px',
            border: '1px solid #000',
            marginLeft: 'auto',
          }}
        >
          GENERATED UI
        </span>
      </div>

      {/* Sandbox container */}
      <div
        style={{
          position: 'relative',
          border: '2px solid #000',
          boxShadow: shadows.md,
          background: '#FFFCF0',
          overflow: 'hidden',
        }}
      >
        {/* Loading shimmer */}
        {loading && (
          <div
            className="animate-shimmer"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'linear-gradient(90deg, #FFFCF0 25%, #F5EFE0 50%, #FFFCF0 75%)',
              backgroundSize: '200% auto',
            }}
          />
        )}

        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          scrolling="no"
          style={{
            width: '100%',
            height,
            border: 'none',
            display: 'block',
            transition: 'height 0.2s ease',
          }}
          title="Generated UI Component"
        />
      </div>
    </motion.div>
  )
}
