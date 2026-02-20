import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { shadows } from '../../lib/theme'
import { highlightCode } from '../../lib/highlight'
import { langLabel } from '../../lib/artifacts'
import type { Artifact } from '../../types'

interface CodeTabProps {
  artifact: Artifact
}

export default function CodeTab({ artifact }: CodeTabProps) {
  const [highlightedHTML, setHighlightedHTML] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    highlightCode(artifact.code, artifact.type).then((html) => {
      if (!cancelled) {
        setHighlightedHTML(html)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [artifact.code, artifact.type])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lineCount = artifact.code.split('\n').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1E1E1E' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '2px solid #000',
          background: '#2A2A2A',
          flexShrink: 0,
        }}
      >
        {/* Language badge */}
        <div
          style={{
            padding: '2px 8px',
            background: '#FFE500',
            border: '1.5px solid #000',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            color: '#000',
          }}
        >
          {langLabel(artifact.type)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Line count */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#888',
              letterSpacing: '0.06em',
            }}
          >
            {lineCount} LINES
          </span>

          {/* Copy button */}
          <motion.button
            whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
            whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
            transition={{ duration: 0.07 }}
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: copied ? '#00CC44' : '#333',
              border: '1.5px solid #000',
              color: copied ? '#fff' : '#ccc',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={9} /> : <Copy size={9} />}
            {copied ? 'COPIED' : 'COPY'}
          </motion.button>
        </div>
      </div>

      {/* Code area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: '#888',
            }}
          >
            Loading syntax highlighting...
          </div>
        ) : highlightedHTML ? (
          <div style={{ display: 'flex', minHeight: '100%' }}>
            {/* Line numbers gutter */}
            <div
              style={{
                padding: '12px 0',
                background: '#1A1A1A',
                borderRight: '2px solid #333',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    lineHeight: '20px',
                    padding: '0 12px',
                    color: '#555',
                    textAlign: 'right',
                    minWidth: 40,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Highlighted code */}
            <div
              className="shiki-code"
              dangerouslySetInnerHTML={{ __html: highlightedHTML }}
              style={{
                flex: 1,
                overflow: 'auto',
              }}
            />
          </div>
        ) : (
          /* Fallback: plain text */
          <pre
            style={{
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: '20px',
              color: '#E0E0E0',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {artifact.code}
          </pre>
        )}
      </div>
    </div>
  )
}
