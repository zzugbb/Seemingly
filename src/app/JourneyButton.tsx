import { useEffect, useRef, useState, type ComponentType } from 'react'
import { journeyStats } from './journey'
import { useApp } from './store'

export function JourneyButton({ className }: { className?: string }) {
  const available = useApp((state) => journeyStats(state.save).available)
  const [open, setOpen] = useState(false)
  const [Dialog, setDialog] = useState<ComponentType<{ onClose: () => void }> | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const show = async () => {
    if (Dialog) {
      setOpen(true)
      return
    }
    if (loading) return
    setLoading(true)
    setFailed(false)
    try {
      const module = await import('./JourneyDialog')
      if (!active.current) return
      setDialog(() => module.default)
      setOpen(true)
    } catch {
      if (active.current) setFailed(true)
    } finally {
      if (active.current) setLoading(false)
    }
  }
  if (!available) return null
  return (
    <>
      <button
        className={className}
        type="button"
        aria-disabled={loading}
        aria-busy={loading}
        onClick={() => void show()}
        aria-haspopup="dialog"
      >
        旅程成绩
      </button>
      {loading && (
        <span className="journey-load-notice" role="status">
          正在准备成绩卡…
        </span>
      )}
      {failed && (
        <span className="journey-load-notice" role="alert">
          成绩卡暂时无法加载，请检查网络，或刷新页面后重试。
        </span>
      )}
      {open && Dialog && <Dialog onClose={() => setOpen(false)} />}
    </>
  )
}
