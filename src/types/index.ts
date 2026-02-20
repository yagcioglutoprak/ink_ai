/** Core domain types for the AI chat app */

export type Role = 'user' | 'assistant'

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error'

export interface ThinkingBlock {
  type: 'thinking'
  content: string
  durationMs?: number
}

export interface TextBlock {
  type: 'text'
  content: string
}

export interface ToolCallBlock {
  type: 'tool_call'
  id: string
  toolName: string
  args: Record<string, unknown>
  status: 'running' | 'success' | 'error'
  result?: unknown
  durationMs?: number
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolCallBlock

export interface Message {
  id: string
  role: Role
  content: string
  blocks?: ContentBlock[]
  status: MessageStatus
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  accentColor: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Artifact {
  id: string
  conversationId: string
  messageId: string
  type: 'html' | 'css' | 'js' | 'ts' | 'tsx' | 'jsx' | 'python' | 'json' | 'text'
  title: string
  code: string
  version: number
  createdAt: number
}

export interface AppState {
  conversations: Conversation[]
  activeConversationId: string | null
  activeArtifactId: string | null
  artifacts: Artifact[]
  sidebarOpen: boolean
  artifactPanelOpen: boolean
}
