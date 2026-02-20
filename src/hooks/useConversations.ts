import { useState, useCallback } from 'react'
import type { Conversation, Message } from '../types'
import { getConversationAccent } from '../lib/theme'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function makeConversation(title = 'New conversation'): Conversation {
  const id = uid()
  return {
    id,
    title,
    accentColor: getConversationAccent(id),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

const SEED_CONVERSATIONS: Conversation[] = [
  { ...makeConversation('Build a landing page'), messages: [], updatedAt: Date.now() - 60_000 },
  { ...makeConversation('Explain quantum computing'), messages: [], updatedAt: Date.now() - 3_600_000 },
  { ...makeConversation('Refactor auth module'), messages: [], updatedAt: Date.now() - 86_400_000 },
  { ...makeConversation('Write unit tests for hooks'), messages: [], updatedAt: Date.now() - 172_800_000 },
]

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  const createConversation = useCallback(() => {
    const c = makeConversation()
    setConversations((prev) => [c, ...prev])
    setActiveId(c.id)
    return c
  }, [])

  const selectConversation = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addMessage = useCallback((conversationId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              updatedAt: Date.now(),
              title: c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 48)
                : c.title,
            }
          : c
      )
    )
  }, [])

  const updateMessage = useCallback((conversationId: string, messageId: string, patch: Partial<Message>) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...patch } : m
              ),
            }
          : c
      )
    )
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
  }, [])

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    addMessage,
    updateMessage,
    deleteConversation,
  }
}
