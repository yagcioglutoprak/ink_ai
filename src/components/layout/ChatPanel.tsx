import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { springs } from '../../lib/theme'
import type { Conversation } from '../../types'
import MessageList from '../chat/MessageList'
import InputBar from '../chat/InputBar'
import EmptyState from '../chat/EmptyState'

interface ChatPanelProps {
  conversation: Conversation | null
  sidebarOpen: boolean
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
}

export default function ChatPanel({
  conversation,
  sidebarOpen,
  onSend,
  onStop,
  isStreaming,
}: ChatPanelProps) {

  const handleSuggestion = useCallback(
    (text: string) => onSend(text),
    [onSend]
  )

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...springs.smooth, delay: 0.1 }}
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        paddingLeft: sidebarOpen ? 0 : 48,
        transition: 'padding-left 0.3s',
      }}
    >
      {/* Header */}
      <ChatHeader conversation={conversation} />

      {/* Messages or empty state */}
      {!conversation || conversation.messages.length === 0 ? (
        <EmptyState onSuggestion={handleSuggestion} />
      ) : (
        <MessageList
          messages={conversation.messages}
          accentColor={conversation.accentColor}
        />
      )}

      {/* Input */}
      <InputBar
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={false}
      />
    </motion.main>
  )
}

/* ── Chat header ──────────────────────────────────────── */
function ChatHeader({ conversation }: { conversation: Conversation | null }) {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
      }}
    >
      {conversation ? (
        <>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: conversation.accentColor,
              boxShadow: `0 0 8px ${conversation.accentColor}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {conversation.title}
          </span>
        </>
      ) : (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-faint)',
          }}
        >
          ink.ai
        </span>
      )}
    </div>
  )
}
