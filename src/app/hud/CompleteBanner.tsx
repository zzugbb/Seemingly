import { Ratings, type RatingsValue } from './Ratings'
import type { LevelRecord } from '../save'
import { ratingCount } from '../entry'
export function CompleteBanner({
  title,
  ratings,
  history,
  usedHint,
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
  history: LevelRecord
  usedHint: boolean
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
        <section className="result-ratings" aria-label="本次结果">
          <h3>本次结果 · {ratingCount(ratings)}/3</h3>
          <Ratings value={ratings} animate />
          <p>
            本次步数 {steps} / 最少 {minimum ?? '—'}
            {usedHint ? ' · 已用提示' : ''}
          </p>
        </section>
        <p className="result-history" aria-label="历史成绩">
          历史评价 {ratingCount(history)}/3
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
