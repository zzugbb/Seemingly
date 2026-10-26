import { useApp } from '../store'
import { JourneyButton } from '../JourneyButton'

export function Ending() {
  const goTitle = useApp((state) => state.goTitle)
  return (
    <div className="ending-message" role="status">
      <h1>谢谢游玩</h1>
      <div className="title-actions">
        <JourneyButton />
        <button type="button" onClick={goTitle}>
          回到标题
        </button>
      </div>
    </div>
  )
}
