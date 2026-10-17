export function Hud({
  label,
  steps,
  orbs,
  muted,
  canUndo,
  thinking,
  onUndo,
  onHint,
  onRestart,
  onSelect,
  onToggleMute,
}: {
  label: string
  steps: number
  orbs: { collected: number; total: number }
  muted: boolean
  canUndo: boolean
  thinking: boolean
  onUndo: () => void
  onHint: () => void
  onRestart: () => void
  onSelect: () => void
  onToggleMute: () => void
}) {
  const options = (
    <>
      <button className="hud-button" type="button" onClick={onRestart}>
        重新开始
      </button>
      <button className="hud-button" type="button" onClick={onSelect}>
        选关
      </button>
      <button className="hud-button" type="button" aria-pressed={muted} onClick={onToggleMute}>
        {muted ? '取消静音' : '静音'}
      </button>
    </>
  )
  return (
    <>
      <header className="title">
        <h1>{label}</h1>
        <p>
          步数 {steps} · 光点 {orbs.collected}/{orbs.total}
        </p>
      </header>
      <div className="hud-actions">
        <button className="hud-button" type="button" disabled={!canUndo} onClick={onUndo}>
          撤销
        </button>
        <button className="hud-button" type="button" aria-busy={thinking} onClick={onHint}>
          {thinking ? '思考中…' : '提示'}
        </button>
        <div className="hud-desktop">{options}</div>
        <details className="hud-menu">
          <summary className="hud-button">菜单</summary>
          <div
            className="hud-menu-options"
            onClick={(event) => {
              event.currentTarget.closest('details')?.removeAttribute('open')
            }}
          >
            {options}
          </div>
        </details>
      </div>
    </>
  )
}
