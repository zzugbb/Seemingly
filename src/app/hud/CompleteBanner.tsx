export function CompleteBanner({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="result">
      <div className="result-card">
        <h2>抵达 · {title}</h2>
        <button type="button" onClick={onAction}>
          {action}
        </button>
      </div>
    </div>
  )
}
