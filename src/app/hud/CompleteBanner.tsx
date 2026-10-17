import { Ratings, type RatingsValue } from './Ratings'
export function CompleteBanner({
  title,
  ratings,
  steps,
  minimum,
  message,
  unlocked,
  action,
  onAction,
  onRetry,
}: {
  title: string
  ratings: RatingsValue
  steps: number
  minimum: number | null
  message?: string
  unlocked: string
  action: string
  onAction: () => void
  onRetry: () => void
}) {
  return (
    <div className="result">
      <div className="result-card">
        <h2>抵达 · {title}</h2>
        <Ratings value={ratings} animate />
        <p>
          步数 {steps} / 最少 {minimum ?? '—'}
        </p>
        {message && <p>{message}</p>}
        {unlocked && <p>{unlocked}</p>}
        <div className="result-actions">
          <button type="button" onClick={onAction}>
            {action}
          </button>
          <button type="button" onClick={onRetry}>
            再试一次
          </button>
        </div>
      </div>
    </div>
  )
}
