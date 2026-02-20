import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2, Code2, Eye, Terminal } from 'lucide-react'
import { springs, shadows } from '../../lib/theme'
import { langLabel, isPreviewable } from '../../lib/artifacts'
import type { Artifact } from '../../types'
import CodeTab from './CodeTab'
import PreviewTab, { type ConsoleEntry } from './PreviewTab'
import ConsoleTab from './ConsoleTab'

interface ArtifactViewerProps {
  artifact: Artifact
  allArtifacts: Artifact[]
  onClose: () => void
  onSelectArtifact: (id: string) => void
}

type TabId = 'code' | 'preview' | 'console'

export default function ArtifactViewer({
  artifact,
  allArtifacts,
  onClose,
  onSelectArtifact,
}: ArtifactViewerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('code')
  const [fullscreen, setFullscreen] = useState(false)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])

  const canPreview = isPreviewable(artifact.type)

  // Auto-switch to preview tab when artifact changes and is previewable
  useEffect(() => {
    if (canPreview) setActiveTab('preview')
  }, [artifact.id, canPreview])

  const handleConsoleLog = useCallback((entry: ConsoleEntry) => {
    setConsoleEntries((prev) => [...prev, entry])
  }, [])

  const clearConsole = useCallback(() => {
    setConsoleEntries([])
  }, [])

  const tabs: { id: TabId; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'code', label: 'CODE', icon: <Code2 size={11} /> },
    { id: 'preview', label: 'PREVIEW', icon: <Eye size={11} />, disabled: !canPreview },
    { id: 'console', label: 'CONSOLE', icon: <Terminal size={11} />, disabled: !canPreview },
  ]

  const errorCount = consoleEntries.filter((e) => e.level === 'error').length

  const panelContent = (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '2px solid #000',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              letterSpacing: '0.04em',
              color: '#000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {artifact.title.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#999',
              letterSpacing: '0.06em',
            }}
          >
            {langLabel(artifact.type)} — v{artifact.version}
          </div>
        </div>

        {/* Fullscreen toggle */}
        <motion.button
          whileHover={{ x: -1, y: -1, boxShadow: shadows.sm }}
          whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
          transition={{ duration: 0.07 }}
          onClick={() => setFullscreen((v) => !v)}
          style={{
            background: 'transparent',
            border: '1.5px solid #000',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#000',
          }}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </motion.button>

        {/* Close */}
        <motion.button
          whileHover={{ x: -1, y: -1, boxShadow: `2px 2px 0 #FF3B3B` }}
          whileTap={{ x: 1, y: 1, boxShadow: 'none' }}
          transition={{ duration: 0.07 }}
          onClick={onClose}
          style={{
            background: '#FF3B3B',
            border: '1.5px solid #000',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#fff',
          }}
          title="Close"
        >
          <X size={12} />
        </motion.button>
      </div>

      {/* Artifact tabs (when multiple) */}
      {allArtifacts.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '2px solid #000',
            background: '#F5EFE0',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {allArtifacts.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectArtifact(a.id)}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                background: a.id === artifact.id ? '#fff' : 'transparent',
                borderRight: '1px solid #ddd',
                borderBottom: a.id === artifact.id ? '2px solid #FFE500' : '2px solid transparent',
                border: 'none',
                borderRightWidth: 1,
                borderRightStyle: 'solid',
                borderRightColor: '#ddd',
                color: a.id === artifact.id ? '#000' : '#888',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: a.id === artifact.id ? 500 : 400,
              }}
            >
              {langLabel(a.type)} — {a.title.length > 16 ? a.title.slice(0, 16) + '...' : a.title}
            </button>
          ))}
        </div>
      )}

      {/* View mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid #000',
          background: '#FAFAF5',
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: activeTab === tab.id ? '#000' : 'transparent',
              color: tab.disabled ? '#ccc' : activeTab === tab.id ? '#FFE500' : '#555',
              cursor: tab.disabled ? 'default' : 'pointer',
              border: 'none',
              borderRight: '1px solid #ddd',
              position: 'relative',
            }}
          >
            {tab.icon}
            {tab.label}
            {/* Console error badge */}
            {tab.id === 'console' && errorCount > 0 && (
              <span
                style={{
                  minWidth: 14,
                  height: 14,
                  background: '#FF3B3B',
                  border: '1px solid #000',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                }}
              >
                {errorCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'code' && <CodeTab artifact={artifact} />}
        {activeTab === 'preview' && (
          <PreviewTab artifact={artifact} onConsoleLog={handleConsoleLog} />
        )}
        {activeTab === 'console' && (
          <ConsoleTab entries={consoleEntries} onClear={clearConsole} />
        )}
      </div>
    </div>
  )

  // Fullscreen modal overlay
  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setFullscreen(false)
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={springs.bouncy}
          style={{
            width: '90vw',
            height: '85vh',
            border: '3px solid #000',
            boxShadow: shadows.xl,
            overflow: 'hidden',
          }}
        >
          {panelContent}
        </motion.div>
      </motion.div>
    )
  }

  return panelContent
}
