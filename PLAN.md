# 🎨 AI Chat Interface — Project Plan

## Vision

A cartoonish, vibrant, ultra-smooth AI chat app that feels alive. Think: neon candy colors on inky dark backgrounds, wobbly bubble animations, playful yet powerful. Every interaction has personality. It's joyful to use, and technically excellent under the hood.

**Aesthetic Direction:** `Ink + Neon` — thick dark backgrounds, chunky outlines/borders, neon accent colors (electric lime, hot coral, sky blue, violet), hand-crafted feel with perfectly smooth motion. Think: a Miyazaki film got a software engineering job.

**Font Pairing:**
- Display: `Clash Display` (bold, geometric, personality)
- Body/Code: `DM Mono` (clean, technical)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React 18 + TypeScript + Vite** | Fast, modern, great DX |
| Styling | **Tailwind CSS + CSS vars** | Utility-first + custom tokens |
| Animations | **Framer Motion** | Production-grade motion |
| AI SDK | **Vercel AI SDK** (`ai` package) | First-class streaming, tool calls, thinking |
| AI Provider | **Anthropic (Claude)** | Thinking, streaming, tool use |
| Code highlighting | **Shiki** | Beautiful, accurate syntax highlighting |
| Markdown | **react-markdown + remark-gfm** | Full markdown rendering |
| Icons | **Lucide React** | Clean, consistent |
| Sandboxed Preview | **iframe with srcdoc** | Safe HTML/CSS/JS execution |
| Web Search Tool | **Tavily API** | Fast, AI-optimized web search |

---

## Phase 1 — Foundation & Design System

**Goal:** Set up the project, design tokens, and global styles. Build nothing visible yet except a design kitchen sink.

### Tasks
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Set up `@fontsource` packages for Clash Display + DM Mono (or Google Fonts import)
- [ ] Define CSS custom properties (color palette, radii, shadows, spacing)
- [ ] Build `theme.ts` — JS-side color/animation tokens
- [ ] Set up Framer Motion `AnimatePresence` globally
- [ ] Configure Vite proxy for API routes (to avoid CORS)
- [ ] Set up environment variables (.env) for API keys
- [ ] Create a basic `App.tsx` layout shell

### Design Tokens Preview
```
--color-bg:        #0D0D12        // Inky black
--color-surface:   #14141C        // Card surfaces
--color-border:    #2A2A3A        // Subtle borders
--color-neon-lime: #C8FF00        // Primary accent
--color-coral:     #FF4F5E        // Secondary accent  
--color-blue:      #4FC3F7        // Sky blue (links, AI)
--color-violet:    #B57BFF        // Thinking / reasoning
--color-text:      #F0F0F8        // Main text
--color-muted:     #8888A0        // Secondary text
--radius-bubble:   18px           // Chat bubbles
--radius-card:     14px           // Cards/panels
```

---

## Phase 2 — Core Chat UI

**Goal:** Build the entire visual shell of the chat — sidebar, message list, input, empty state. No AI yet, just stubs.

### Tasks
- [ ] **Layout:** Three-panel system
  - Left sidebar (conversation list, collapsible)
  - Center chat area (scrollable message thread)
  - Right panel (artifacts viewer, hidden by default)
- [ ] **Sidebar:**
  - New chat button (big, neon lime, bouncy)
  - Conversation list with hover animations
  - Logo / branding header
  - Collapse animation
- [ ] **Message Bubbles:**
  - User messages: right-aligned, neon lime accent, chunky border
  - AI messages: left-aligned, surface color, subtle glow
  - Avatar with animated gradient for AI
  - Timestamps on hover
  - Bubble pop-in animation (spring physics)
- [ ] **Input Area:**
  - Large textarea, auto-resize
  - Send button with animated arrow
  - Attach / web search toggle buttons
  - Keyboard shortcut hints
  - Animated border glow on focus
- [ ] **Empty State:**
  - Full-screen animated welcome
  - Floating prompt suggestion chips
  - Orbiting particle effect (CSS keyframes)
- [ ] **Scrolling:**
  - Auto-scroll to bottom on new messages
  - "Jump to bottom" FAB when scrolled up
  - Smooth scroll behavior

---

## Phase 3 — AI Integration & Streaming

**Goal:** Connect to Anthropic Claude API via Vercel AI SDK. Support real-time streaming, token-by-token rendering.

### Tasks
- [ ] Set up Express.js or Hono backend (or Vite plugin server)
- [ ] Create `/api/chat` route using Vercel AI SDK + Anthropic provider
- [ ] Implement streaming response with `useChat` hook (or custom `fetch` + `ReadableStream`)
- [ ] **Streaming text renderer:**
  - Characters appear with staggered fade-in
  - Cursor blink animation while streaming
  - Smooth markdown parsing on partial content
- [ ] **Thinking / Extended Reasoning UI:**
  - Collapsible "Thinking..." panel above the response
  - Violet/purple color scheme for thinking tokens
  - Animated "brain pulse" loader while thinking
  - Accordion expand/collapse with spring animation
  - Show thinking duration in milliseconds
- [ ] **Loading states:**
  - Three-dot bounce animation while waiting for first token
  - Skeleton shimmer for slow starts
- [ ] **Error handling:**
  - Friendly error messages with retry button
  - Rate limit detection and countdown
- [ ] **Stop generation** button (mid-stream abort)
- [ ] **Regenerate / edit** message actions on hover

---

## Phase 4 — Tool Calls & Web Search

**Goal:** Show tool calls as they happen in real-time. Integrate web search with Tavily.

### Tasks
- [ ] Define tools in AI SDK: `webSearch`, `calculator` (bonus)
- [ ] Integrate **Tavily Search API** as `webSearch` tool
- [ ] **Tool call rendering in chat:**
  - Inline "tool card" component that appears mid-stream
  - Shows: tool name, arguments (expandable JSON), status (running/done/error)
  - Animated progress bar while tool runs
  - Results collapsed by default, expand to see raw data
  - Web search shows: query, result count, source URLs with favicons
- [ ] **Web search result previews:**
  - Small cards with title + snippet + domain
  - Animate in one-by-one (staggered)
- [ ] **Tool states:**
  - `pending`: spinning gear icon, lime glow
  - `running`: animated progress bar
  - `success`: checkmark with confetti pop
  - `error`: red X with shake animation
- [ ] Show total search time elapsed

---

## Phase 5 — Artifacts UI (Code Split View)

**Goal:** When AI writes HTML/CSS/JS code, automatically detect it and open a split-panel artifact viewer. Left = code, Right = live rendered preview.

### Tasks
- [ ] **Artifact detection:**
  - Detect code blocks tagged `html`, `css`, `js`, `tsx`, `jsx` in stream
  - Also detect when AI explicitly says it's creating an artifact
  - Parse artifact type from first fence line
- [ ] **Artifact panel (right side):**
  - Slides in from the right with spring animation
  - Resizable split (drag handle)
  - Tabs: `Code` | `Preview` | `Console`
  - Close/minimize controls
- [ ] **Code tab:**
  - Shiki syntax highlighting (Catppuccin Mocha theme variant, customized)
  - Line numbers
  - Copy button with "Copied!" feedback
  - Language badge (top right)
  - Diff view when artifact is updated
- [ ] **Preview tab (HTML/CSS/JS):**
  - Sandboxed `<iframe srcdoc>` rendering
  - Auto-refresh when code updates during streaming
  - Error overlay for JS runtime errors (caught via `onerror`)
  - Responsive size toggles: mobile / tablet / desktop
  - Device frame mock (phone chrome for mobile)
- [ ] **Console tab:**
  - Capture `console.log`, `console.error` from iframe
  - Color-coded log levels
- [ ] **Multiple artifacts:**
  - Tabs at top of panel for each artifact in the conversation
  - Artifact history / version timeline
- [ ] **Full-screen mode** for artifacts (modal overlay)

---

## Phase 6 — Polish, Animations & Details

**Goal:** Make it extraordinary. Every edge case handled, every animation perfect.

### Tasks
- [ ] **Page load sequence:**
  - Staggered reveal of sidebar → header → chat area → input
  - Logo animation (draw stroke effect)
- [ ] **Theme:** Dark only (ink + neon is the identity)
- [ ] **Sound FX** (optional, toggleable): subtle "pop" on message send, "woosh" on new response
- [ ] **Keyboard shortcuts:**
  - `Cmd+K` — new chat
  - `Cmd+/` — focus input
  - `Escape` — close artifact panel
- [ ] **Context menu** on messages: Copy, Regenerate, Edit, Delete
- [ ] **Mobile responsive:** Stack to single column, bottom sheet for artifact
- [ ] **Conversation persistence:** `localStorage` for session history
- [ ] **Streaming markdown:** Handle partial code blocks without breaking highlighting
- [ ] **Scroll performance:** Virtualize long conversations (react-virtual)
- [ ] **Custom scrollbar** styling (thin, neon accent)
- [ ] **Accessibility:** ARIA labels, keyboard navigation, focus trapping in modals
- [ ] **README:** Setup guide + feature docs

---

## File Structure

```
ai-chat-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   └── ArtifactPanel.tsx
│   │   ├── chat/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ThinkingBlock.tsx
│   │   │   ├── ToolCallCard.tsx
│   │   │   ├── StreamingText.tsx
│   │   │   └── InputBar.tsx
│   │   ├── artifacts/
│   │   │   ├── ArtifactViewer.tsx
│   │   │   ├── CodeTab.tsx
│   │   │   ├── PreviewTab.tsx
│   │   │   └── ConsoleTab.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Chip.tsx
│   │       └── AnimatedText.tsx
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useArtifacts.ts
│   │   └── useConversations.ts
│   ├── lib/
│   │   ├── ai.ts              # AI SDK setup
│   │   ├── tools.ts           # Tool definitions
│   │   ├── artifacts.ts       # Artifact detection/parsing
│   │   └── highlight.ts       # Shiki setup
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── animations.css
│   └── App.tsx
├── server/
│   ├── index.ts               # Express/Hono server
│   └── routes/
│       └── chat.ts            # /api/chat endpoint
├── .env.example
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── PLAN.md
```

---

## Milestones

| Phase | Estimated Work | Deliverable |
|---|---|---|
| 1 — Foundation | Medium | Design system, project scaffold |
| 2 — Chat UI | Large | Full visual shell, no AI |
| 3 — Streaming AI | Large | Live streaming chat with thinking |
| 4 — Tool Calls | Medium | Web search with animated tool cards |
| 5 — Artifacts | Large | Split code/preview panel |
| 6 — Polish | Medium | Production-ready, animated, complete |

---

## Design Rules

- **No emojis anywhere in the UI.** Use icons (Lucide React), custom SVGs, or typographic elements instead. This applies to buttons, labels, empty states, loading states, tool cards, thinking blocks — everywhere. The aesthetic is sharp and intentional, not emoji-decorated.

---

## Key Creative Decisions

1. **Thick neon borders on chat bubbles** — not subtle outlines, real chunky cartoon-style borders that glow
2. **Wobbly bubble entrance** — messages spring in with a slight overshoot (scale 0.8 → 1.05 → 1.0)
3. **Thinking block as an expandable panel** — custom animated SVG icon + violet glow, shows token count
4. **Tool calls look like trading cards** — illustrated icons, status LEDs, result data in a collapsible drawer
5. **Artifact panel slides in like a drawer** — not a modal, keeps chat visible
6. **Cursor in streaming text is a blinking block** — monospace feel even in prose
7. **Empty state has floating suggestion "orbs"** — gradient spheres with hover levitation
8. **Sidebar conversations have color-coded dots** — each chat gets a random accent color

---

*Ready to build. Awaiting your go-ahead.*
