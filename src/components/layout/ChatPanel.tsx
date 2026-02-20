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
  onSend: (text: string, options?: { webSearch?: boolean }) => void
  onStop: () => void
  onRegenerate: (messageId: string) => void
  isStreaming: boolean
}

export default function ChatPanel({
  conversation,
  sidebarOpen,
  onSend,
  onStop,
  onRegenerate,
  isStreaming,
}: ChatPanelProps) {
  const handleSuggestion = useCallback((text: string) => onSend(text, {}), [onSend])

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
        background: '#FFFCF0',
      }}
    >
      <ChatHeader conversation={conversation} />

      {!conversation || conversation.messages.length === 0 ? (
        <EmptyState onSuggestion={handleSuggestion} />
      ) : (
        <MessageList
          messages={conversation.messages}
          accentColor={conversation.accentColor}
          onRegenerate={onRegenerate}
        />
      )}

      <InputBar
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={false}
      />
    </motion.main>
  )
}

function ChatHeader({ conversation }: { conversation: Conversation | null }) {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '2px solid #000',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        background: '#fff',
      }}
    >
      {conversation ? (
        <>
          <div
            style={{
              width: 14,
              height: 14,
              background: conversation.accentColor,
              border: '2px solid #000',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 400,
              letterSpacing: '0.04em',
              color: '#000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {conversation.title.toUpperCase()}
          </span>
        </>
      ) : (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: '#aaa',
          }}
        >
          INK.AI
        </span>
      )}
    </div>
  )
}
