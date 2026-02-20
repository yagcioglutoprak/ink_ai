import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { springs, stagger } from '../../lib/theme'
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
            width: 280,
            minWidth: 280,
            height: '100%',
            background: 'var(--color-surface)',
            borderRight: '1.5px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          {/* ── Header ──────────────────────────────── */}
          <div
            style={{
              padding: '20px 16px 16px',
              borderBottom: '1.5px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {/* Logo */}
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-neon-lime)',
                  textShadow: '0 0 20px rgba(200,255,0,0.5)',
                }}
              >
                ink.ai
              </span>
            </div>

            {/* Collapse button */}
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* ── New Chat Button ──────────────────────── */}
          <div style={{ padding: '12px 12px 8px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springs.quick}
              onClick={onCreate}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: 'var(--color-neon-lime)',
                border: '2px solid var(--color-neon-lime)',
                borderRadius: 'var(--radius-card)',
                color: '#0D0D12',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 0 20px rgba(200,255,0,0.3)',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New chat
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
              gap: 2,
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
                }}
              >
                No conversations yet.
                <br />
                Start a new chat above.
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
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-faint)',
              letterSpacing: '0.05em',
            }}
          >
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        </motion.aside>
      )}

      {/* ── Collapsed toggle button ──────────────────── */}
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
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-muted)',
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
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: isActive
          ? `${accent}14`
          : isHovered
          ? 'var(--color-surface-2)'
          : 'transparent',
        border: isActive ? `1px solid ${accent}33` : '1px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent dot */}
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: accent,
          flexShrink: 0,
          boxShadow: isActive ? `0 0 8px ${accent}` : undefined,
        }}
      />

      {/* Icon */}
      <MessageSquare
        size={13}
        style={{ color: isActive ? accent : 'var(--color-faint)', flexShrink: 0 }}
      />

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--color-text)' : 'var(--color-muted)',
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
            color: 'var(--color-faint)',
            marginTop: 1,
          }}
        >
          {timeAgo(conversation.updatedAt)}
        </div>
      </div>

      {/* Delete button */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springs.quick}
            onClick={onDelete}
            title={isDeleteTarget ? 'Click again to confirm' : 'Delete'}
            style={{
              background: isDeleteTarget ? 'rgba(255,79,94,0.2)' : 'none',
              border: 'none',
              color: isDeleteTarget ? 'var(--color-coral)' : 'var(--color-faint)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
