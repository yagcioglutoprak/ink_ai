/**
 * highlight.ts — Shiki syntax highlighting setup.
 *
 * Lazy-loads a single shared Shiki highlighter instance.
 * Uses a dark theme that fits the neo-brutalist aesthetic.
 */

import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

const SUPPORTED_LANGS = [
  'html',
  'css',
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'python',
  'json',
  'bash',
  'markdown',
] as const

/** Lazy-load a Shiki highlighter */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vitesse-dark'],
      langs: [...SUPPORTED_LANGS],
    })
  }
  return highlighterPromise
}

/** Map artifact types to Shiki language IDs */
export function toShikiLang(type: string): string {
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    html: 'html',
    css: 'css',
    tsx: 'tsx',
    jsx: 'jsx',
    python: 'python',
    json: 'json',
    text: 'markdown',
  }
  return map[type] ?? 'markdown'
}

/** Highlight code and return HTML string */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter()
  const shikiLang = toShikiLang(lang)
  return highlighter.codeToHtml(code, {
    lang: shikiLang,
    theme: 'vitesse-dark',
  })
}
