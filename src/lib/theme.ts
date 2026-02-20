/**
 * theme.ts — JS-side design tokens for Ink + Neon system
 * Mirrors CSS custom properties for use in Framer Motion,
 * dynamic styles, and component logic.
 */

export const colors = {
  bg:        '#0D0D12',
  surface:   '#14141C',
  surface2:  '#1A1A26',
  border:    '#2A2A3A',
  border2:   '#3A3A52',

  // Neon accents
  neonLime:  '#C8FF00',
  coral:     '#FF4F5E',
  blue:      '#4FC3F7',
  violet:    '#B57BFF',
  amber:     '#FFB547',

  // Text
  text:      '#F0F0F8',
  muted:     '#8888A0',
  faint:     '#4A4A60',
} as const

export const glows = {
  lime:   '0 0 20px rgba(200, 255, 0, 0.35), 0 0 60px rgba(200, 255, 0, 0.12)',
  coral:  '0 0 20px rgba(255, 79, 94, 0.35),  0 0 60px rgba(255, 79, 94, 0.12)',
  blue:   '0 0 20px rgba(79, 195, 247, 0.35), 0 0 60px rgba(79, 195, 247, 0.12)',
  violet: '0 0 20px rgba(181, 123, 255, 0.35),0 0 60px rgba(181, 123, 255, 0.12)',
} as const

export const radius = {
  bubble: 18,
  card:   14,
  sm:     8,
  xs:     4,
} as const

export const fonts = {
  display: "'Clash Display', sans-serif",
  mono:    "'DM Mono', monospace",
} as const

export const spacing = {
  sidebarWidth:   280,
  artifactWidth:  520,
} as const

/** Framer Motion spring presets */
export const springs = {
  /** Snappy, bouncy — for bubble entrance */
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 22,
    mass: 0.8,
  },
  /** Smooth, elegant — for panel slides */
  smooth: {
    type: 'spring' as const,
    stiffness: 280,
    damping: 32,
    mass: 1,
  },
  /** Quick, no bounce — for micro-interactions */
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6,
  },
} as const

/** Stagger delay helpers */
export const stagger = {
  fast:   0.04,
  normal: 0.08,
  slow:   0.12,
} as const

/** Chat accent colors — one per conversation */
export const conversationAccents = [
  colors.neonLime,
  colors.coral,
  colors.blue,
  colors.violet,
  colors.amber,
] as const

/** Get a deterministic accent color from a conversation ID */
export function getConversationAccent(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return conversationAccents[Math.abs(hash) % conversationAccents.length]
}
