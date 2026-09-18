import { Eraser, Pause, Play, Share2, Trash2, Undo2 } from 'lucide-react'

type Props = {
  playing: boolean
  tempo: number
  color: string
  eraserMode: boolean
  onToggle: () => void
  onUndo: () => void
  onClear: () => void
  onShare: () => void
  onTempo: (tempo: number) => void
  onColor: (color: string) => void
  onEraser: () => void
}

const colors = ['#1a8c72', '#dd5635', '#5a50c8', '#e5a13a', '#2e5bbd', '#d05a9b', '#72acd4', '#20211f']

export default function Controls({ playing, tempo, color, eraserMode, onToggle, onUndo, onClear, onShare, onTempo, onColor, onEraser }: Props) {
  return (
    <section className="controls" aria-label="Composition controls">
      <div className="control-row primary-controls">
        <button className="round-button dark" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={18} strokeWidth={2.5} aria-hidden="true" /> : <Play size={18} strokeWidth={2.5} aria-hidden="true" />}</button>
        <button className="round-button" onClick={onUndo} aria-label="Undo last stroke"><Undo2 size={18} strokeWidth={2.2} aria-hidden="true" /></button>
        <button className="round-button" onClick={onClear} aria-label="Clear drawing"><Trash2 size={18} strokeWidth={2.2} aria-hidden="true" /></button>
        <button className={`round-button eraser-button ${eraserMode ? 'active' : ''}`} onClick={onEraser} aria-label={eraserMode ? 'Exit eraser mode' : 'Erase a complete stroke'} aria-pressed={eraserMode}><Eraser size={18} strokeWidth={2.2} aria-hidden="true" /></button>
        <button className="share-button" onClick={onShare} aria-label="Share composition"><Share2 size={17} strokeWidth={2.3} aria-hidden="true" /> <span>Share</span></button>
        <label className="tempo-control">tempo <input type="range" min="50" max="180" value={tempo} onChange={(event) => onTempo(Number(event.target.value))} /><strong>{tempo}</strong></label>
      </div>
      <div className="control-row palette" aria-label="Ink colors">
        {colors.map((item) => <button key={item} className={`color-dot ${item === color ? 'selected' : ''}`} style={{ backgroundColor: item }} onClick={() => onColor(item)} aria-label={`Use ${item} ink`} />)}
      </div>
    </section>
  )
}
