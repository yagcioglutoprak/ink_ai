import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { springs, stagger, shadows } from '../../lib/theme'
import type { Conversation } from '../../types'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  open: boolean
  onToggle: () => void
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  open,
  onToggle,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={springs.smooth}
          style={{
            width: isMobile ? '100vw' : 280,
            minWidth: isMobile ? '100vw' : 280,
            height: '100%',
            background: '#FFFCF0',
            borderRight: '3px solid #000',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: isMobile ? 50 : 20,
            flexShrink: 0,
            ...(isMobile ? { position: 'fixed' as const, inset: 0 } : { position: 'relative' as const }),
          }}
        >
          {/* ── Header ──────────────────────────────── */}
          <div
            style={{
              padding: '20px 16px 16px',
              borderBottom: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFE500',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: '#000',
                lineHeight: 1,
              }}
            >
              INK.AI
            </span>

            <button
              onClick={onToggle}
              style={{
                background: '#000',
                border: '2px solid #000',
                color: '#FFE500',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: shadows.sm,
              }}
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          {/* ── New Chat Button ──────────────────────── */}
          <div style={{ padding: '12px 12px 8px' }}>
            <motion.button
              whileHover={{ x: -2, y: -2, boxShadow: shadows.lg }}
              whileTap={{ x: 2, y: 2, boxShadow: 'none' }}
              transition={{ duration: 0.08 }}
              onClick={onCreate}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#000',
                border: '2px solid #000',
                boxShadow: shadows.md,
                color: '#FFE500',
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Plus size={16} strokeWidth={3} />
              NEW CHAT
            </motion.button>
          </div>

          {/* ── Conversation List ────────────────────── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 8px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {conversations.length === 0 && (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--color-faint)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.8,
                  border: '2px dashed #999',
                  margin: 8,
                }}
              >
                NO CONVERSATIONS YET.
                <br />
                START A NEW CHAT ABOVE.
              </div>
            )}

            {conversations.map((conv, i) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                isHovered={hoveredId === conv.id}
                isDeleteTarget={deleteTarget === conv.id}
                delay={i * stagger.fast}
                onSelect={() => onSelect(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => { setHoveredId(null); setDeleteTarget(null) }}
                onDelete={(e) => {
                  e.stopPropagation()
                  if (deleteTarget === conv.id) {
                    onDelete(conv.id)
                    setDeleteTarget(null)
                  } else {
                    setDeleteTarget(conv.id)
                  }
                }}
              />
            ))}
          </div>

          {/* ── Footer ──────────────────────────────── */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '2px solid #000',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#555',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        </motion.aside>
      )}

      {/* ── Collapsed toggle ─────────────────────────── */}
      {!open && (
        <motion.button
          key="toggle"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={springs.quick}
          onClick={onToggle}
          style={{
            position: 'absolute',
            left: 12,
            top: 16,
            zIndex: 30,
            background: '#FFE500',
            border: '2px solid #000',
            boxShadow: shadows.sm,
            color: '#000',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <PanelLeft size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ── Conversation row ────────────────────────────────── */
interface ConvRowProps {
  conversation: Conversation
  isActive: boolean
  isHovered: boolean
  isDeleteTarget: boolean
  delay: number
  onSelect: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDelete: (e: React.MouseEvent) => void
}

function ConversationRow({
  conversation,
  isActive,
  isHovered,
  isDeleteTarget,
  delay,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onDelete,
}: ConvRowProps) {
  const accent = conversation.accentColor

  return (
    <motion.div
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...springs.smooth, delay }}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        padding: '9px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: isActive ? accent : isHovered ? '#F5EFE0' : 'transparent',
        border: isActive ? '2px solid #000' : '2px solid transparent',
        boxShadow: isActive ? shadows.sm : 'none',
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {/* Accent swatch */}
      <div
        style={{
          width: 10,
          height: 10,
          background: accent,
          border: '1.5px solid #000',
          flexShrink: 0,
        }}
      />

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: isActive ? 500 : 400,
            color: '#000',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {conversation.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#777',
            marginTop: 1,
            letterSpacing: '0.05em',
          }}
        >
          {timeAgo(conversation.updatedAt)}
        </div>
      </div>

      {/* Delete */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springs.quick}
            onClick={onDelete}
            title={isDeleteTarget ? 'Confirm delete' : 'Delete'}
            style={{
              background: isDeleteTarget ? '#FF3B3B' : 'transparent',
              border: `1.5px solid ${isDeleteTarget ? '#FF3B3B' : '#000'}`,
              color: isDeleteTarget ? '#fff' : '#000',
              cursor: 'pointer',
              padding: 3,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
