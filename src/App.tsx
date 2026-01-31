import React, { useEffect, useState, useCallback } from "react"
import { Box } from "@opentui/react"
import { Canvas, Sidebar, StatusBar } from "./components"
import { getStore, type AppState, type NodeType } from "./state"

interface AppProps {
  onQuit: () => void
  onMessage: (msg: string) => void
}

export function App({ onQuit, onMessage }: AppProps) {
  const store = getStore()
  const [state, setState] = useState<AppState>(store.getState())
  const [statusMessage, setStatusMessage] = useState<string>("")

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [store])

  // Show temporary status messages
  const showMessage = useCallback((msg: string, duration = 3000) => {
    setStatusMessage(msg)
    onMessage(msg)
    setTimeout(() => setStatusMessage(""), duration)
  }, [onMessage])

  // Add node handler
  const handleAddNode = useCallback(async (type: NodeType) => {
    if (!state.currentCanvas) {
      showMessage("Create a canvas first with [n]")
      return
    }

    try {
      // Position new nodes in a grid-like pattern
      const nodeCount = state.nodes.length
      const x = (nodeCount % 4) * 220 + 50
      const y = Math.floor(nodeCount / 4) * 120 + 50

      const node = await store.createNode(type, `New ${type}`, { x, y })
      store.dispatch({ type: "SELECT_NODE", payload: node.id })
      showMessage(`Added ${type} node`)
    } catch (err) {
      showMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }, [state.currentCanvas, state.nodes.length, store, showMessage])

  // Mode change handler
  const handleModeChange = useCallback((mode: AppState["mode"]) => {
    store.dispatch({ type: "SET_MODE", payload: mode })
    showMessage(`Mode: ${mode}`)
  }, [store, showMessage])

  // Node selection handler
  const handleSelectNode = useCallback((id: string | null) => {
    store.dispatch({ type: "SELECT_NODE", payload: id })
  }, [store])

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Sidebar */}
        <Sidebar
          state={state}
          onAddNode={handleAddNode}
          onModeChange={handleModeChange}
        />

        {/* Canvas */}
        <Canvas state={state} onSelectNode={handleSelectNode} />
      </Box>

      {/* Status bar */}
      <StatusBar state={state} message={statusMessage} />
    </Box>
  )
}
