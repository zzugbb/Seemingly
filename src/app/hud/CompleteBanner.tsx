import { Ratings, type RatingsValue } from './Ratings'
import { ratingCount } from '../entry'
import { JourneyButton } from '../JourneyButton'
export function CompleteBanner({
  title,
  ratings,
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
        {message && <p>{message}</p>}
        {unlocked && <p>{unlocked}</p>}
        <div className="result-actions">
          <button type="button" onClick={onAction}>
            {action}
          </button>
          <button type="button" onClick={onRetry}>
            再试一次
          </button>
          <JourneyButton />
        </div>
      </div>
    </div>
  )
}
