# INK.AI

A neo-brutalist AI chat interface with streaming responses, live code previews, and generative UI widgets.

Built with React 18, TypeScript, Vite, and Framer Motion.

---

## Features

- **Streaming AI Chat** — Real-time token-by-token streaming with Claude (Anthropic) via Vercel AI SDK patterns
- **Extended Thinking** — Collapsible thinking blocks show AI reasoning with duration tracking
- **Tool Calls** — Web search integration with Tavily API, rendered as interactive cards
- **Artifacts Panel** — Code blocks open in a split-panel viewer with syntax highlighting (Shiki) and live HTML/CSS/JS preview via sandboxed iframe
- **Generative UI** — AI can render pre-built widgets inline (color palettes, comparison tables, pros/cons lists, calculators) or generate arbitrary JSX executed in a sandbox
- **Conversation Management** — Multiple conversations with color-coded accents, persisted to localStorage
- **Keyboard Shortcuts** — `Cmd+K` new chat, `Cmd+/` focus input, `Escape` close panels
- **Mobile Responsive** — Full-screen overlays for sidebar and artifact panel on small screens
- **Neo-Brutalist Design** — Flat colors, hard shadows, thick borders, Bebas Neue + DM Mono typography

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Animations | Framer Motion |
| AI Backend | Express + Vercel AI SDK + Anthropic |
| Code Highlighting | Shiki |
| Markdown | react-markdown + remark-gfm |
| Icons | Lucide React |
| Web Search | Tavily API |

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key
- (Optional) A Tavily API key for web search

### Setup

```bash
# Clone and install
git clone <repo-url>
cd ai-chat-app
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...          # Optional, for web search
PORT=3001                         # Server port
```

### Development

```bash
# Start the backend server
npm run server

# In another terminal, start the frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── artifacts/       # Code viewer, preview, console tabs
│   ├── chat/            # Messages, input, empty state
│   ├── generative-ui/   # AI-rendered widgets (ColorPalette, etc.)
│   ├── layout/          # Sidebar, ChatPanel, ArtifactPanel
│   └── ui/              # Shared UI primitives
├── hooks/               # useConversations, useArtifacts
├── lib/                 # API client, theme, artifact utils, Shiki
├── styles/              # Global CSS, animations
└── types/               # TypeScript interfaces
server/
├── index.ts             # Express server
└── routes/
    └── chat.ts          # /api/chat streaming endpoint
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | New conversation |
| `Cmd/Ctrl + /` | Focus message input |
| `Escape` | Close artifact panel |
| `Enter` | Send message |
| `Shift + Enter` | New line in input |

## License

MIT
