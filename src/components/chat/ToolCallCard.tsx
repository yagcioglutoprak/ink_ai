import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, ChevronUp, ExternalLink, Check, AlertCircle, Search, Clock } from 'lucide-react'
import { springs, shadows } from '../../lib/theme'
import type { ToolCallBlock, WebSearchResult } from '../../types'

interface ToolCallCardProps {
  block: ToolCallBlock
  /** When true, collapse the card (e.g. when the model starts responding) */
  forceCollapsed?: boolean
}

const STATUS_CONFIG = {
  pending: { label: 'QUEUED', color: '#FFE500', bg: '#FFFDE0' },
  running: { label: 'SEARCHING', color: '#0055FF', bg: '#F0F4FF' },
  success: { label: 'DONE', color: '#00CC44', bg: '#F0FFF4' },
  error: { label: 'FAILED', color: '#FF3B3B', bg: '#FFF0F0' },
} as const

export default function ToolCallCard({ block, forceCollapsed }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(block.status === 'running' || block.status === 'pending')
  const status = STATUS_CONFIG[block.status]

  // Auto-expand while running/success, collapse when parent signals
  useEffect(() => {
    if (forceCollapsed) {
      setExpanded(false)
    } else if (block.status === 'running' || block.status === 'pending' || block.status === 'success') {
      setExpanded(true)
    }
  }, [block.status, forceCollapsed])
  const isWebSearch = block.toolName === 'web_search'
  const searchQuery = (block.args?.query as string) ?? ''
  const searchResults = isWebSearch && block.result && 'results' in (block.result as Record<string, unknown>)
    ? (block.result as { results: WebSearchResult[] }).results
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.bouncy}
      style={{ width: '100%', marginTop: 4, marginBottom: 4 }}
    >
      {/* Card shell */}
      <div
        style={{
          border: '2px solid #000',
          boxShadow: shadows.md,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: status.bg,
            borderBottom: '2px solid #000',
            cursor: 'pointer',
            border: 'none',
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            borderBottomColor: '#000',
          }}
        >
          {/* Tool icon */}
          <div
            style={{
              width: 28,
              height: 28,
              background: status.color,
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isWebSearch ? (
              <Globe size={14} color="#000" strokeWidth={2.5} />
            ) : (
              <Search size={14} color="#000" strokeWidth={2.5} />
            )}
          </div>

          {/* Tool name + query */}
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                letterSpacing: '0.06em',
                color: '#000',
                lineHeight: 1,
              }}
            >
              {isWebSearch ? 'WEB SEARCH' : block.toolName.toUpperCase()}
            </div>
            {searchQuery && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#555',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {searchQuery}
              </div>
            )}
          </div>

          {/* Status LED */}
          <StatusLED status={block.status} color={status.color} />

          {/* Status badge */}
          <div
            style={{
              padding: '3px 8px',
              background: status.color,
              border: '1.5px solid #000',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.12em',
              color: '#000',
              flexShrink: 0,
            }}
          >
            {status.label}
          </div>

          {/* Duration */}
          {block.durationMs != null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: '#999',
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              <Clock size={9} />
              {block.durationMs < 1000
                ? `${block.durationMs}ms`
                : `${(block.durationMs / 1000).toFixed(1)}s`}
            </div>
          )}

          {/* Expand chevron */}
          <div style={{ flexShrink: 0, color: '#555' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {/* Running state — animated progress bar */}
        {(block.status === 'running' || block.status === 'pending') && (
          <div style={{ height: 3, background: '#f0f0f0', overflow: 'hidden' }}>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '40%',
                height: '100%',
                background: status.color,
              }}
            />
          </div>
        )}

        {/* Success confetti bar */}
        {block.status === 'success' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: 3,
              background: '#00CC44',
              transformOrigin: 'left',
            }}
          />
        )}

        {/* Error bar */}
        {block.status === 'error' && (
          <div style={{ height: 3, background: '#FF3B3B' }} />
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {/* Arguments panel */}
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #e0e0e0',
                  background: '#FAFAF5',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#999',
                    marginBottom: 4,
                  }}
                >
                  ARGUMENTS
                </div>
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#333',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {JSON.stringify(block.args, null, 2)}
                </pre>
              </div>

              {/* Error message */}
              {block.status === 'error' && block.error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#FFF0F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={13} color="#FF3B3B" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#CC0000' }}>
                    {block.error}
                  </span>
                </div>
              )}

              {/* Raw result (non-web-search tools) */}
              {block.status === 'success' && block.result && !isWebSearch && (
                <div style={{ padding: '10px 14px', background: '#FAFAF5' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#999',
                      marginBottom: 4,
                    }}
                  >
                    RESULT
                  </div>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: '#333',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(block.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Web search results */}
              {isWebSearch && block.status === 'success' && searchResults.length > 0 && (
                <div style={{ padding: '8px 10px', background: '#FAFAF5' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#999',
                      marginBottom: 6,
                      paddingLeft: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {searchResults.length} RESULTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {searchResults.map((result, i) => (
                      <SearchResultCard key={i} result={result} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Status LED indicator ───────────────────────────────── */
function StatusLED({ status, color }: { status: string; color: string }) {
  return (
    <div
      className={status === 'running' || status === 'pending' ? 'animate-led-blink' : ''}
      style={{
        width: 8,
        height: 8,
        background: color,
        border: '1px solid #000',
        flexShrink: 0,
        transition: 'background 0.3s',
      }}
    />
  )
}

/* ── Search result card ─────────────────────────────────── */
function SearchResultCard({ result, index }: { result: WebSearchResult; index: number }) {
  const domain = (() => {
    try { return new URL(result.url).hostname.replace('www.', '') } catch { return result.url }
  })()

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
      whileHover={{ x: -2, y: -1, boxShadow: shadows.sm }}
      whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
      style={{
        display: 'block',
        padding: '8px 10px',
        background: '#fff',
        border: '1.5px solid #000',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'box-shadow 0.07s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <img
          src={faviconUrl}
          alt=""
          width={12}
          height={12}
          style={{ flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#999',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {domain}
        </span>
        <ExternalLink size={9} color="#999" style={{ marginLeft: 'auto', flexShrink: 0 }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 500,
          color: '#000',
          lineHeight: 1.3,
          marginBottom: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {result.title}
      </div>
      {result.snippet && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#777',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {result.snippet}
        </div>
      )}
    </motion.a>
  )
}

/* ── Success checkmark ──────────────────────────────────── */
export function ToolSuccessIcon() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={springs.bouncy}
      style={{
        width: 16,
        height: 16,
        background: '#00CC44',
        border: '1.5px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Check size={10} color="#fff" strokeWidth={3} />
    </motion.div>
  )
}
