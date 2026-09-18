import { useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import DrawingCanvas from './components/DrawingCanvas'
import Controls from './components/Controls'
import { compositionFromLocation, compositionUrl, defaultComposition, detectHits, simplifyPoints, type Composition, type Point } from './model'
import { PianoSynth } from './audio'

const colors = ['#dd5635', '#5a50c8', '#1a8c72', '#e5a13a', '#2e5bbd', '#d05a9b', '#72acd4', '#20211f']

function App() {
  const [composition, setComposition] = useState<Composition>(() => compositionFromLocation() ?? defaultComposition)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [activeHits, setActiveHits] = useState<{ key: string; y: number }[]>([])
  const [color, setColor] = useState(colors[0])
  const [eraserMode, setEraserMode] = useState(false)
  const [notice, setNotice] = useState('')
  const synthRef = useRef<PianoSynth | null>(null)
  const compositionRef = useRef(composition)
  const playheadRef = useRef(0)
  const lastXRef = useRef(0)
  const seenRef = useRef(new Set<string>())
  const frameRef = useRef<number | null>(null)
  const hitTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    compositionRef.current = composition
  }, [composition])

  useEffect(() => {
    const timeout = window.setTimeout(() => window.history.replaceState(null, '', compositionUrl(composition)), 250)
    return () => window.clearTimeout(timeout)
  }, [composition])

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      return
    }
    synthRef.current ??= new PianoSynth()
    void synthRef.current.resume()
    let previousTime = performance.now()
    const tick = (time: number) => {
      const delta = Math.min(time - previousTime, 80)
      previousTime = time
      const currentComposition = compositionRef.current
      const speed = currentComposition.tempo / 480000
      const nextX = playheadRef.current + delta * speed
      const wrapped = nextX >= 1
      const from = lastXRef.current
      if (nextX < lastXRef.current) seenRef.current.clear()
      const hits = detectHits(currentComposition.strokes, from, wrapped ? 1 : nextX, seenRef.current)
      if (wrapped) seenRef.current.clear()
      if (hits.length) {
        hits.forEach((hit) => synthRef.current?.play(hit.y))
        setActiveHits(hits.map(({ key, y }) => ({ key, y })))
        if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current)
        hitTimeoutRef.current = window.setTimeout(() => setActiveHits([]), 240)
      }
      lastXRef.current = wrapped ? 0 : nextX
      playheadRef.current = wrapped ? 0 : nextX
      setPlayhead(wrapped ? 0 : nextX)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current)
    }
  }, [playing])

  const addStroke = (points: Point[]) => {
    setComposition((current) => ({ ...current, strokes: [...current.strokes, { color, points: simplifyPoints(points) }] }))
  }

  const togglePlaying = () => {
    if (!playing) {
      lastXRef.current = playhead
      playheadRef.current = playhead
      seenRef.current.clear()
      setPlaying(true)
    } else {
      setPlaying(false)
      setActiveHits([])
    }
  }

  const share = async () => {
    const url = compositionUrl(composition)
    try {
      if (navigator.share) await navigator.share({ title: 'My echoo song', text: 'Listen to this drawing', url })
      else {
        await navigator.clipboard.writeText(url)
        setNotice('Link copied')
        window.setTimeout(() => setNotice(''), 2200)
      }
    } catch {
      setNotice('Sharing cancelled')
      window.setTimeout(() => setNotice(''), 2200)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <div><p className="eyebrow">DRAW / LISTEN / SHARE</p><h1>echoo</h1></div>
        <button className="help-button" aria-label="About echoo"><CircleHelp size={19} strokeWidth={2.2} aria-hidden="true" /></button>
      </header>
      <section className="intro"><div><p className="kicker">A first echo</p><h2>Press play.<br /><em>Watch it listen.</em></h2></div><p className="instructions">This sketch is already tuned. The moving line turns each crossing into a note.</p></section>
      <section className="workbench">
        <div className="canvas-meta"><span>01 / UNTITLED SKETCH</span><span>{composition.strokes.length} {composition.strokes.length === 1 ? 'line' : 'lines'}</span></div>
        <div className="canvas-frame"><div className="grid-glow" /><DrawingCanvas strokes={composition.strokes} playhead={playhead} hits={activeHits} onStroke={addStroke} onEraseStroke={(index) => { if (index >= 0) setComposition((current) => ({ ...current, strokes: current.strokes.filter((_, strokeIndex) => strokeIndex !== index) })) }} color={color} eraserMode={eraserMode} /></div>
        <div className="canvas-caption"><span>Every crossing becomes a note</span><span className={playing ? 'live' : ''}>{playing ? 'LISTENING' : 'READY'} <i /></span></div>
      </section>
      <Controls playing={playing} tempo={composition.tempo} color={color} eraserMode={eraserMode} onToggle={togglePlaying} onUndo={() => setComposition((current) => ({ ...current, strokes: current.strokes.slice(0, -1) }))} onClear={() => { setPlaying(false); setComposition((current) => ({ ...current, strokes: [] })) }} onShare={share} onTempo={(tempo) => setComposition((current) => ({ ...current, tempo }))} onColor={(nextColor) => { setColor(nextColor); setEraserMode(false) }} onEraser={() => setEraserMode((current) => !current)} />
      <footer><span>made for quiet ideas</span><span>echoo / 2026</span></footer>
      {notice && <div className="notice" role="status">{notice}</div>}
    </main>
  )
}

export default App
