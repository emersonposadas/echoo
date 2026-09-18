import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Point, Stroke } from '../model'

type Props = {
  strokes: Stroke[]
  playhead: number
  hits: { key: string; y: number }[]
  onStroke: (points: Point[]) => void
  onEraseStroke: (index: number) => void
  color: string
  eraserMode: boolean
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const projection = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  const closestX = start.x + projection * dx
  const closestY = start.y + projection * dy
  return Math.hypot(point.x - closestX, point.y - closestY)
}

function strokeAtPoint(strokes: Stroke[], point: Point) {
  let nearestIndex = -1
  let nearestDistance = 0.04
  strokes.forEach((stroke, strokeIndex) => {
    stroke.points.slice(1).forEach((end, segmentIndex) => {
      const distance = distanceToSegment(point, stroke.points[segmentIndex], end)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = strokeIndex
      }
    })
  })
  return nearestIndex
}

export default function DrawingCanvas({ strokes, playhead, hits, onStroke, onEraseStroke, color, eraserMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef<Point[]>([])
  const [draft, setDraft] = useState<Point[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return
    const draw = () => {
      const rect = container.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      strokes.forEach((stroke) => {
        context.strokeStyle = stroke.color
        context.lineWidth = 4
        context.beginPath()
        stroke.points.forEach((point, index) => {
          const x = point.x * rect.width
          const y = point.y * rect.height
          if (index === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        })
        context.stroke()
      })
      if (draft.length > 1) {
        context.strokeStyle = color
        context.lineWidth = 4
        context.beginPath()
        draft.forEach((point, index) => {
          const x = point.x * rect.width
          const y = point.y * rect.height
          if (index === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        })
        context.stroke()
      }
      const x = playhead * rect.width
      context.strokeStyle = '#20211f'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, rect.height)
      context.stroke()
      hits.forEach((hit) => {
        context.fillStyle = '#20211f'
        context.beginPath()
        context.arc(x, hit.y * rect.height, 6, 0, Math.PI * 2)
        context.fill()
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [strokes, playhead, hits, draft, color])

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    return { x: Math.min(0.975, Math.max(0.025, x)), y: Math.min(0.975, Math.max(0.025, y)) }
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onPointerDown={(event) => {
        const point = pointFromEvent(event)
        if (eraserMode) {
          onEraseStroke(strokeAtPoint(strokes, point))
          return
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        drawingRef.current = [point]
        setDraft(drawingRef.current)
      }}
      onPointerMove={(event) => {
        if (!drawingRef.current.length) return
        drawingRef.current.push(pointFromEvent(event))
        setDraft([...drawingRef.current])
      }}
      onPointerUp={(event) => {
        const wasDrawing = drawingRef.current.length > 0
        if (drawingRef.current.length > 1) onStroke(drawingRef.current)
        drawingRef.current = []
        setDraft([])
        if (wasDrawing) event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => { drawingRef.current = []; setDraft([]) }}
      style={{ '--ink': color } as CSSProperties}
      aria-label="Musical drawing surface"
    />
  )
}
