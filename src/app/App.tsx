"use client";
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  NodeDimensionChange,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './canvas-overrides.css'
import NoteNode, { NoteData } from '../components/NoteNode'
import SystemInstructionsButton from '../components/SystemInstructionsButton'
import UserMenu from '../components/UserMenu'
import ZoomControls from '../components/ZoomControls'
import { edgesAtom, lastAddedNodeIdAtom, nodesAtom, viewportAtom } from '../store/canvasAtoms'
import {
  pushFuture,
  pushHistory,
  pushToPast,
  redo,
  undo,
} from '../store/historyStore'
import { Node, Edge, Viewport } from '@xyflow/react';

function anyNodeInView(nodes: Node[], viewport: Viewport, viewWidth: number, viewHeight: number) {
  if (!viewport || typeof viewport.x !== 'number' || typeof viewport.zoom !== 'number') return false
  const zoom = viewport.zoom
  const left = -viewport.x / zoom
  const top = -viewport.y / zoom
  const right = left + viewWidth / zoom
  const bottom = top + viewHeight / zoom
  return nodes.some((node) => {
    const px = node.position?.x ?? 0
    const py = node.position?.y ?? 0
    const w = typeof node.style?.width === 'number' ? node.style.width : 680
    const h = typeof node.style?.height === 'number' ? node.style.height : 250
    const nRight = px + w
    const nBottom = py + h
    return !(nRight < left || px > right || nBottom < top || py > bottom)
  })
}

const NODE_TYPES = { note: NoteNode }

function Canvas() {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [edges, setEdges] = useAtom(edgesAtom)
  const [viewport, setViewport] = useAtom(viewportAtom)
  const [lastAddedNodeId, setLastAddedNodeId] = useAtom(lastAddedNodeIdAtom)
  const lastClickRef = useRef({ time: 0, x: 0, y: 0 })
  const edgesRef = useRef(edges as Edge[])
  const isResizingRef = useRef(false)

  useEffect(() => {
    edgesRef.current = edges as Edge[]
  }, [edges])

  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes: NodeChange<Node>[]) =>
      setNodes((nds) => {
        const hasRemove = changes.some((c) => c.type === 'remove')
        const hasDimensions = changes.some((c) => c.type === 'dimensions')

        if (hasRemove) {
          pushHistory(nds as Node[], edgesRef.current)
        } else if (hasDimensions && !isResizingRef.current) {
          isResizingRef.current = true
          pushHistory(nds as Node[], edgesRef.current)
        }
        if (!hasDimensions) isResizingRef.current = false

        const updated = applyNodeChanges(changes, nds as Node[])
        const removedIds = new Set((nds as Node[]).filter((n: Node) => !updated.some((u) => u.id === n.id)).map((n) => n.id))
        const parentIdsToClearHighlight = new Set()
        if (removedIds.size) {
          (nds as Node[]).forEach((n: Node) => {
            if (removedIds.has(n.id)) {
              const parentId = n.data?.parentNodeId
              if (parentId) parentIdsToClearHighlight.add(parentId)
            }
          })
        }
        return updated.map((node) => {
          const dimChange = changes.find((c): c is NodeDimensionChange => c.type === 'dimensions' && c.id === node.id)
          if (dimChange?.dimensions) {
            return {
              ...node,
              style: { ...node.style, width: dimChange.dimensions.width, height: dimChange.dimensions.height },
            }
          }
          if (parentIdsToClearHighlight.has(node.id)) {
            const restData = { ...node.data }
            delete restData.persistedHighlight
            return { ...node, data: restData }
          }
          return node
        })
      }),
    [setNodes]
  )
  const onEdgesChange: OnEdgesChange<Edge> = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds as Edge[]) as Edge[]),
    [setEdges]
  )

  const onInit = useCallback(
    (instance: ReactFlowInstance<Node, Edge>) => {
      if ((nodes as Node[]).length === 0) {
        const newId = `node-${Date.now()}`
        const center = instance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
        setNodes([
          {
            id: newId,
            position: { x: center.x - 260, y: center.y - 40 },
            data: {},
            type: 'note',
            style: { width: '85ch' },
          },
        ])
        setLastAddedNodeId(newId)
        if (!viewport) {
          requestAnimationFrame(() => {
            instance.fitView({
              nodes: [{ id: newId }],
              padding: 0.2,
              minZoom: 0.25,
              maxZoom: 1,
              duration: 250,
            })
          })
        }
      } else if (!viewport) {
        instance.fitView({ padding: 0.2, minZoom: 0.25, maxZoom: 1, duration: 250 })
      }
    },
    [nodes, setNodes, setLastAddedNodeId, viewport]
  )

  useEffect(() => {
    if (!lastAddedNodeId) return
    setNodes((nds) =>
      (nds as Node[]).map((n: Node) => ({ ...n, selected: n.id === lastAddedNodeId }))
    )
  }, [lastAddedNodeId, setNodes])

  const onPaneClick = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now()
      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY
      const { time, x, y } = lastClickRef.current

      if (
        now - time < 400 &&
        Math.abs(clientX - x) < 10 &&
        Math.abs(clientY - y) < 10
      ) {
        const position = screenToFlowPosition({ x: clientX, y: clientY })
        const newId = `node-${Date.now()}`
        setNodes((nds) => {
          pushHistory(nds as Node[], edgesRef.current)
          return [
            ...(nds as Node[]),
            {
              id: newId,
              position,
              data: {},
              type: 'note',
              style: { width: '85ch' },
            },
          ]
        })
        setLastAddedNodeId(newId)
        lastClickRef.current = { time: 0, x: 0, y: 0 }
        return
      }
      lastClickRef.current = { time: now, x: clientX, y: clientY }
    },
    [screenToFlowPosition, setNodes, setLastAddedNodeId]
  )

  const onNodeDragStart = useCallback(() => {
    pushHistory(nodes as Node[], edges as Edge[])
  }, [nodes, edges])

  const onSelectionDragStart = useCallback(() => {
    pushHistory(nodes as Node[], edges as Edge[])
  }, [nodes, edges])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement
      const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        if (inInput) return
        e.preventDefault()
        const selected = (nodes as Node[]).filter((n: Node) => n.selected)
        if (selected.length > 0) {
          fitView({
            nodes: [{ id: selected[0].id }],
            padding: 0.2,
            minZoom: 0.1,
            maxZoom: 1,
            duration: 250,
          })
        }
        return
      }

      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return
      if (inInput) return

      e.preventDefault()
      if (e.shiftKey) {
        const next = redo()
        if (next) {
          pushToPast(nodes as Node[], edges as Edge[])
          setNodes(next.nodes)
          setEdges(next.edges)
        }
      } else {
        const prev = undo()
        if (prev) {
          pushFuture(nodes as Node[], edges as Edge[])
          setNodes(prev.nodes)
          setEdges(prev.edges)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nodes, edges, setNodes, setEdges, fitView])

  const hasPersistedViewport = viewport && typeof (viewport as Viewport).x === 'number' && typeof (viewport as Viewport).zoom === 'number'

  return (
    <ReactFlow
      nodes={nodes as Node[]}
      edges={edges as Edge[]}
      minZoom={0.25}
      onInit={onInit}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPaneClick={onPaneClick}
      onNodeDragStart={onNodeDragStart}
      onSelectionDragStart={onSelectionDragStart}
      onViewportChange={setViewport as (viewport: Viewport) => void}
      deleteKeyCode={['Backspace', 'Delete']}
      defaultViewport={hasPersistedViewport ? viewport as Viewport : undefined}
      fitView={!hasPersistedViewport}
      fitViewOptions={{ padding: 0.2, minZoom: 0.25, maxZoom: 1 }}
      nodeTypes={NODE_TYPES}
      nodesConnectable={false}
      zoomOnDoubleClick={false}
      panOnScroll
      zoomOnScroll
      panOnScrollSpeed={1.5}
      panOnDrag={[1, 2]}
      selectionOnDrag
      selectionMode={SelectionMode.Partial}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <ZoomControls />
      <Panel position="top-left" className="m-4!">
        <SystemInstructionsButton />
      </Panel>
      <Panel position="top-right" className="m-4! flex flex-col gap-2">
        <UserMenu />
      </Panel>
    </ReactFlow>
  )
}

function App() {
  const [nodes] = useAtom(nodesAtom)
  const [viewport] = useAtom(viewportAtom)
  const [[vw, vh], setViewSize] = useState(() =>
    typeof window !== 'undefined' ? [window.innerWidth, window.innerHeight] : [0, 0]
  )
  useEffect(() => {
    const onResize = () => setViewSize([window.innerWidth, window.innerHeight])
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const singleNewMessageWindow =
    (nodes as Node[]).length === 1 && (Array.isArray((nodes[0].data as NoteData)?.messages) ? ((nodes[0].data as NoteData).messages?.length ?? 0) : 0) === 0
  const showEmptyBanner = useMemo(() => {
    if ((nodes as Node[]).length === 0) return true
    if (singleNewMessageWindow) return true
    if (!viewport || vw === 0 || vh === 0) return false
    return !anyNodeInView(nodes as Node[], viewport as Viewport, vw, vh)
  }, [nodes, viewport, vw, vh, singleNewMessageWindow])

  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerFadedIn, setBannerFadedIn] = useState(false)
  const [bannerFadingOut, setBannerFadingOut] = useState(false)
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (showEmptyBanner) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
      const showTimer = setTimeout(() => {
        setBannerVisible(true)
        setBannerFadedIn(false)
        setBannerFadingOut(false)
      }, 200)
      return () => clearTimeout(showTimer)
    }
    requestAnimationFrame(() => {
      setBannerFadingOut(true)
    })
    exitTimerRef.current = setTimeout(() => {
      setBannerVisible(false)
      setBannerFadingOut(false)
      setBannerFadedIn(false)
      exitTimerRef.current = null
    }, 300)
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [showEmptyBanner])

  useEffect(() => {
    if (!bannerVisible || bannerFadingOut) return
    const frame = requestAnimationFrame(() => setBannerFadedIn(true))
    return () => cancelAnimationFrame(frame)
  }, [bannerVisible, bannerFadingOut])

  return (
    <Tooltip.Provider delayDuration={300}>
      <ReactFlowProvider>
        <div className="w-full h-screen relative">
          <Canvas />
          {bannerVisible && (
            <div
              className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-10 px-6 py-2 rounded-full text-center transition-all duration-300 backdrop-blur-md bg-white/10 dark:bg-black/40 shadow-xl border border-white/10 ${bannerFadedIn && !bannerFadingOut
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                }`}
              aria-live="polite"
            >
              <p className="text-[10px] text-foreground/50 font-sans uppercase tracking-[0.2em] mb-0.5">
                Double click anywhere to write a new message.
              </p>
              <p className="text-sm font-medium text-foreground">
                Made by Ashish Zinya
              </p>
            </div>
          )}
        </div>
      </ReactFlowProvider>
    </Tooltip.Provider>
  )
}

export default App