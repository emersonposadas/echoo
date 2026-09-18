type Props = {
  playing: boolean
  tempo: number
  color: string
  onToggle: () => void
  onUndo: () => void
  onClear: () => void
  onShare: () => void
  onTempo: (tempo: number) => void
  onColor: (color: string) => void
}

const colors = ['#1a8c72', '#dd5635', '#5a50c8', '#e5a13a', '#2e5bbd', '#d05a9b', '#72acd4', '#20211f']

export default function Controls({ playing, tempo, color, onToggle, onUndo, onClear, onShare, onTempo, onColor }: Props) {
  return (
    <section className="controls" aria-label="Composition controls">
      <div className="control-row primary-controls">
        <button className="round-button dark" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '||' : '>'}</button>
        <button className="round-button" onClick={onUndo} aria-label="Undo last stroke">↶</button>
        <button className="round-button" onClick={onClear} aria-label="Clear drawing">×</button>
        <button className="share-button" onClick={onShare} aria-label="Share composition"><span aria-hidden="true">↗</span> Share</button>
        <label className="tempo-control">tempo <input type="range" min="40" max="120" value={tempo} onChange={(event) => onTempo(Number(event.target.value))} /><strong>{tempo}</strong></label>
      </div>
      <div className="control-row palette" aria-label="Ink colors">
        {colors.map((item) => <button key={item} className={`color-dot ${item === color ? 'selected' : ''}`} style={{ backgroundColor: item }} onClick={() => onColor(item)} aria-label={`Use ${item} ink`} />)}
      </div>
    </section>
  )
}
