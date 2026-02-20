import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { springs } from '../../lib/theme'
import type { Artifact } from '../../types'
import ArtifactViewer from '../artifacts/ArtifactViewer'

interface ArtifactPanelProps {
  artifact: Artifact
  allArtifacts: Artifact[]
  onClose: () => void
  onSelectArtifact: (id: string) => void
}

const MIN_WIDTH = 360
const MAX_WIDTH = 900
const DEFAULT_WIDTH = 520

export default function ArtifactPanel({
  artifact,
  allArtifacts,
  onClose,
  onSelectArtifact,
}: ArtifactPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={springs.smooth}
      style={{
        width,
        height: '100%',
        flexShrink: 0,
        borderLeft: '3px solid #000',
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Drag handle (left edge) */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          zIndex: 10,
          background: 'transparent',
        }}
        title="Drag to resize"
      >
        {/* Visual grip dots */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 1,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 3,
                background: '#ccc',
              }}
            />
          ))}
        </div>
      </div>

      <ArtifactViewer
        artifact={artifact}
        allArtifacts={allArtifacts}
        onClose={onClose}
        onSelectArtifact={onSelectArtifact}
      />
    </motion.aside>
  )
}
