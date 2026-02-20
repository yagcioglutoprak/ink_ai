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

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchData {
  query: string
  results: WebSearchResult[]
  count: number
}

export interface ToolCallBlock {
  type: 'tool_call'
  id: string
  toolName: string
  args: Record<string, unknown>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: WebSearchData | Record<string, unknown>
  error?: string
  durationMs?: number
}

/**
 * renderUI — AI picks a pre-built widget from the catalogue
 * generateComponent — AI writes arbitrary JSX, executed in a sandbox
 */
export interface GenerativeUIBlock {
  type: 'generative_ui'
  /** 'widget' = pre-built catalogue, 'generated' = AI-written JSX */
  mode: 'widget' | 'generated'
  /** For mode='widget': the catalogue key (e.g. 'ColorPalette') */
  widgetType?: string
  /** For mode='widget': props passed to the pre-built component */
  props?: Record<string, unknown>
  /** For mode='generated': raw JSX string the AI produced */
  code?: string
  /** Optional caption shown above the widget */
  caption?: string
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolCallBlock | GenerativeUIBlock

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
