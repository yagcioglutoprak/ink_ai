import { useState, useCallback } from 'react'
import type { Artifact } from '../types'

export function useArtifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) ?? null

  const addArtifact = useCallback((artifact: Artifact) => {
    setArtifacts((prev) => {
      // Replace if same conversation + message + type (version bump)
      const existing = prev.find(
        (a) =>
          a.conversationId === artifact.conversationId &&
          a.messageId === artifact.messageId &&
          a.type === artifact.type,
      )
      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? { ...artifact, id: existing.id, version: existing.version + 1 }
            : a,
        )
      }
      return [...prev, artifact]
    })
    setActiveArtifactId(artifact.id)
    setPanelOpen(true)
  }, [])

  const selectArtifact = useCallback((id: string) => {
    setActiveArtifactId(id)
    setPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen((v) => !v)
  }, [])

  /** Get all artifacts for a specific conversation */
  const getConversationArtifacts = useCallback(
    (conversationId: string) => artifacts.filter((a) => a.conversationId === conversationId),
    [artifacts],
  )

  /** Update an existing artifact's code in-place (for streaming) */
  const updateArtifactCode = useCallback((id: string, code: string) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, code } : a)),
    )
  }, [])

  return {
    artifacts,
    activeArtifact,
    activeArtifactId,
    panelOpen,
    addArtifact,
    updateArtifactCode,
    selectArtifact,
    closePanel,
    togglePanel,
    getConversationArtifacts,
  }
}
