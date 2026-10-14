export function Hud({
  label,
  muted,
  onRestart,
  onSelect,
  onToggleMute,
}: {
  label: string
  muted: boolean
  onRestart: () => void
  onSelect: () => void
  onToggleMute: () => void
}) {
  return (
    <>
      <header className="title">
        <h1>{label}</h1>
      </header>
      <div className="hud-actions">
        <button className="hud-button" type="button" onClick={onRestart}>
          重新开始
        </button>
        <button className="hud-button" type="button" onClick={onSelect}>
          选关
        </button>
        <button className="hud-button" type="button" aria-pressed={muted} onClick={onToggleMute}>
          {muted ? '取消静音' : '静音'}
        </button>
      </div>
    </>
  )
}
