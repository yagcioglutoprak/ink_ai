/**
 * theme.ts — Neo-Brutalist design tokens
 */

export const colors = {
  bg:        '#FFFCF0',
  surface:   '#FFFFFF',
  surface2:  '#F5EFE0',
  border:    '#000000',
  border2:   '#333333',

  // Flat vivid accents
  yellow:    '#FFE500',
  red:       '#FF3B3B',
  blue:      '#0055FF',
  green:     '#00CC44',
  pink:      '#FF2D78',

  // Aliases used in Phase 3+
  neonLime:  '#FFE500',
  coral:     '#FF3B3B',
  violet:    '#7B2FFF',
  amber:     '#FF8C00',

  text:      '#0A0A0A',
  muted:     '#555555',
  faint:     '#999999',
} as const

export const shadows = {
  sm:  '2px 2px 0px #000000',
  md:  '3px 3px 0px #000000',
  lg:  '5px 5px 0px #000000',
  xl:  '7px 7px 0px #000000',
} as const

export const fonts = {
  display: "'Bebas Neue', 'Clash Display', sans-serif",
  mono:    "'DM Mono', monospace",
} as const

export const spacing = {
  sidebarWidth:   280,
  artifactWidth:  520,
} as const

/** Framer Motion spring presets */
export const springs = {
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 22,
    mass: 0.8,
  },
  smooth: {
    type: 'spring' as const,
    stiffness: 280,
    damping: 32,
    mass: 1,
  },
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6,
  },
} as const

export const stagger = {
  fast:   0.04,
  normal: 0.08,
  slow:   0.12,
} as const

/** Per-conversation accent fills — flat brutalist colors */
export const conversationAccents = [
  colors.yellow,
  colors.red,
  colors.blue,
  colors.green,
  colors.pink,
] as const

export function getConversationAccent(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return conversationAccents[Math.abs(hash) % conversationAccents.length]
}

/** Glows — not used in brutalism, kept for Phase 3 compat */
export const glows = {
  lime:   'none',
  coral:  'none',
  blue:   'none',
  violet: 'none',
} as const

export const radius = {
  bubble: 0,
  card:   0,
  sm:     0,
  xs:     0,
} as const
