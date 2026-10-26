import { lazy, Suspense, useState } from 'react'
import { journeyStats } from './journey'
import { useApp } from './store'

const JourneyDialog = lazy(() => import('./JourneyDialog'))

export function JourneyButton({ className }: { className?: string }) {
  const available = useApp((state) => journeyStats(state.save).available)
  const [open, setOpen] = useState(false)
  if (!available) return null
  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        旅程成绩
      </button>
      {open && (
        <Suspense fallback={<span role="status">正在准备成绩卡…</span>}>
          <JourneyDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
