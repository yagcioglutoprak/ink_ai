/**
 * artifacts.ts — Artifact detection & parsing from markdown content.
 *
 * Scans AI message content for fenced code blocks and extracts them
 * as artifacts that can be opened in the artifact panel.
 */

import type { Artifact } from '../types'

/** Languages that get a live preview tab */
export const PREVIEWABLE_LANGS = new Set(['html', 'css', 'js', 'javascript', 'jsx', 'tsx'])

/** Normalise language tag from code fence to Artifact type */
export function normaliseLang(lang: string): Artifact['type'] {
  const l = lang.toLowerCase().trim()
  const map: Record<string, Artifact['type']> = {
    html: 'html',
    css: 'css',
    js: 'js',
    javascript: 'js',
    ts: 'ts',
    typescript: 'ts',
    tsx: 'tsx',
    jsx: 'jsx',
    python: 'python',
    py: 'python',
    json: 'json',
  }
  return map[l] ?? 'text'
}

/** Pretty display name for a language */
export function langLabel(type: Artifact['type']): string {
  const labels: Record<string, string> = {
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TSX',
    jsx: 'JSX',
    python: 'Python',
    json: 'JSON',
    text: 'Text',
  }
  return labels[type] ?? type.toUpperCase()
}

/** Extract code fence info line to get a title hint */
function extractTitle(infoLine: string, lang: string): string {
  // e.g. ```html title="My Page"  or ```js // calculator.js
  const titleMatch = infoLine.match(/title\s*=\s*"([^"]+)"/)
  if (titleMatch) return titleMatch[1]

  const commentMatch = infoLine.match(/\/\/\s*(.+)/)
  if (commentMatch) return commentMatch[1].trim()

  return `${langLabel(normaliseLang(lang))} snippet`
}

export interface ParsedCodeBlock {
  lang: string
  code: string
  title: string
  startIndex: number
}

/** Parse all fenced code blocks from markdown content */
export function parseCodeBlocks(content: string): ParsedCodeBlock[] {
  const blocks: ParsedCodeBlock[] = []
  const regex = /```(\w+[^\n]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const infoLine = match[1]
    const lang = infoLine.split(/\s/)[0]
    const code = match[2].trimEnd()

    if (code.length < 10) continue // skip tiny snippets

    blocks.push({
      lang,
      code,
      title: extractTitle(infoLine, lang),
      startIndex: match.index,
    })
  }

  return blocks
}

let _artifactCounter = 0

/** Create an Artifact from a parsed code block */
export function createArtifact(
  block: ParsedCodeBlock,
  conversationId: string,
  messageId: string,
): Artifact {
  _artifactCounter++
  return {
    id: `artifact-${Date.now()}-${_artifactCounter}`,
    conversationId,
    messageId,
    type: normaliseLang(block.lang),
    title: block.title,
    code: block.code,
    version: 1,
    createdAt: Date.now(),
  }
}

/** Check if an artifact type supports live preview */
export function isPreviewable(type: Artifact['type']): boolean {
  return type === 'html' || type === 'js' || type === 'jsx' || type === 'tsx' || type === 'css'
}

/**
 * Build a full HTML document for preview from code + type.
 * Wraps CSS-only or JS-only snippets in a proper HTML shell.
 */
export function buildPreviewHTML(code: string, type: Artifact['type']): string {
  if (type === 'html') {
    // If the code already has <html> or <body>, use as-is
    if (code.includes('<html') || code.includes('<!DOCTYPE')) return code
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Mono',monospace;padding:16px;background:#FFFCF0;color:#0A0A0A}</style>
</head><body>${code}</body></html>`
  }

  if (type === 'css') {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>${code}</style>
<style>body{font-family:'DM Mono',monospace;padding:16px;background:#FFFCF0;color:#0A0A0A}</style>
</head><body><div class="preview">CSS Preview</div></body></html>`
  }

  if (type === 'js' || type === 'jsx' || type === 'tsx') {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Mono',monospace;padding:16px;background:#FFFCF0;color:#0A0A0A}</style>
</head><body><div id="root"></div>
<script>${code}${"<"}/script>
</body></html>`
  }

  return ''
}
