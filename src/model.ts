export type Point = { x: number; y: number }

export type Stroke = {
  color: string
  points: Point[]
}

export type Composition = {
  version: 1
  tempo: number
  strokes: Stroke[]
}

export type Hit = {
  key: string
  y: number
  strokeIndex: number
}

const boundaryMargin = 0.025

const palette = ['#dd5635', '#5a50c8', '#1a8c72', '#e5a13a', '#2e5bbd']

export const defaultComposition: Composition = {
  version: 1,
  tempo: 110,
  strokes: [
    { color: '#e34f3f', points: [{ x: 0.1, y: 0.58 }, { x: 0.22, y: 0.48 }, { x: 0.34, y: 0.4 }, { x: 0.46, y: 0.45 }, { x: 0.58, y: 0.32 }, { x: 0.7, y: 0.38 }, { x: 0.82, y: 0.24 }, { x: 0.9, y: 0.3 }] },
    { color: '#5c50d7', points: [{ x: 0.16, y: 0.72 }, { x: 0.3, y: 0.67 }, { x: 0.44, y: 0.72 }, { x: 0.58, y: 0.63 }, { x: 0.74, y: 0.68 }] },
    { color: '#1a8c72', points: [{ x: 0.27, y: 0.26 }, { x: 0.41, y: 0.21 }, { x: 0.55, y: 0.26 }, { x: 0.69, y: 0.19 }, { x: 0.83, y: 0.23 }] },
  ],
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeComposition(value: unknown): Composition | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Composition>
  if (candidate.version !== 1 || !Array.isArray(candidate.strokes)) return null
  const strokes = candidate.strokes.slice(0, 80).flatMap((stroke) => {
    if (!stroke || typeof stroke !== 'object' || !Array.isArray(stroke.points)) return []
    const color = typeof stroke.color === 'string' && /^#[0-9a-f]{6}$/i.test(stroke.color) ? stroke.color : palette[0]
    const points = stroke.points.slice(0, 500).flatMap((point) => {
      if (!point || typeof point !== 'object') return []
      const source = point as Partial<Point>
      return typeof source.x === 'number' && typeof source.y === 'number'
        ? [{ x: clamp(source.x, 0, 1), y: clamp(source.y, 0, 1) }]
        : []
    })
    return points.length > 1 ? [{ color, points }] : []
  })
  return { version: 1, tempo: clamp(typeof candidate.tempo === 'number' ? candidate.tempo : 110, 50, 180), strokes }
}

export function encodeComposition(composition: Composition) {
  const json = JSON.stringify(composition)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export function decodeComposition(encoded: string | null) {
  if (!encoded) return null
  try {
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4)
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return sanitizeComposition(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

export function compositionFromLocation() {
  return decodeComposition(new URLSearchParams(window.location.search).get('piece'))
}

export function compositionUrl(composition: Composition) {
  const url = new URL(window.location.href)
  url.searchParams.set('piece', encodeComposition(composition))
  return url.toString()
}

export function detectHits(strokes: Stroke[], previousX: number, currentX: number, seen: Set<string>): Hit[] {
  const hits: Hit[] = []
  strokes.forEach((stroke, strokeIndex) => {
    stroke.points.slice(1).forEach((point, segmentIndex) => {
      const start = stroke.points[segmentIndex]
      const end = point
      const isLeftEdge = start.x <= boundaryMargin && end.x <= boundaryMargin
      const isRightEdge = start.x >= 1 - boundaryMargin && end.x >= 1 - boundaryMargin
      const isTopEdge = start.y <= boundaryMargin && end.y <= boundaryMargin
      const isBottomEdge = start.y >= 1 - boundaryMargin && end.y >= 1 - boundaryMargin
      if (isLeftEdge || isRightEdge || isTopEdge || isBottomEdge) return
      const minimumX = Math.min(start.x, end.x)
      const maximumX = Math.max(start.x, end.x)
      const crosses = minimumX <= currentX && maximumX >= previousX
      if (!crosses) return
      const key = `${strokeIndex}:${segmentIndex}`
      if (seen.has(key)) return
      const span = end.x - start.x
      const crossingX = clamp(Math.max(previousX, minimumX), minimumX, maximumX)
      const ratio = span === 0 ? 0 : clamp((crossingX - start.x) / span, 0, 1)
      seen.add(key)
      hits.push({ key, y: start.y + (end.y - start.y) * ratio, strokeIndex })
    })
  })
  return hits
}

export function noteForY(y: number) {
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
  const index = Math.round(clamp(1 - y, 0, 1) * (scale.length - 1))
  return 48 + scale[index]
}
