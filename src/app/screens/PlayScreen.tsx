import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSound } from '../../audio/sfx'
import { stateKey } from '../../game/core/rules'
import { LevelSim, type SimEvent } from '../../game/core/sim'
import { type LevelDef } from '../../game/levels'
import { targets } from '../../game/levels/targets'
import { Scene } from '../../game/render/Scene'
import type { RenderHint } from '../../game/render/feedback'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { CompleteBanner } from '../hud/CompleteBanner'
import type { RatingsValue } from '../hud/Ratings'
import { Hud } from '../hud/Hud'
import { Ending } from './Ending'
import { Toast } from '../hud/Toast'
import { isUnlocked, levelLists, useApp, type LevelList } from '../store'
import { playSimEvent } from '../sounds'
import { prepareHints } from '../hints'

export function PlayScreen() {
  const current = useApp((state) => state.current)
  const level = levelLists[current.list][current.index]
  if (!level) return null
  return <LevelPlay key={`${current.list}:${level.id}`} level={level} list={current.list} index={current.index} />
}

function LevelPlay({ level, list, index }: { level: LevelDef; list: LevelList; index: number }) {
  const [runId, setRunId] = useState(0)
  const restart = useCallback(() => setRunId((id) => id + 1), [])
  return <Run key={runId} level={level} list={list} index={index} onRestart={restart} />
}

function Run({
  level,
  list,
  index,
  onRestart,
}: {
  level: LevelDef
  list: LevelList
  index: number
  onRestart: () => void
}) {
  const ending = useApp((state) => state.screen === 'ending')
  const goSelect = useApp((state) => state.goSelect)
  const play = useApp((state) => state.play)
  const completeLevel = useApp((state) => state.completeLevel)
  const goEnding = useApp((state) => state.goEnding)
  const toggleMute = useApp((state) => state.toggleMute)
  const muted = useApp((state) => state.save.muted)
  const quality = useApp((state) => state.quality)
  const settings = useMemo(() => qualitySettings(quality), [quality])
  const reducedMotion = prefersReducedMotion()
  const sim = useMemo(() => new LevelSim(level), [level])
  const [toast, setToast] = useState<string | null>(null)
  const [result, setResult] = useState<{ ratings: RatingsValue; steps: number; unlocked: string } | null>(null)
  const [endingReady, setEndingReady] = useState(false)
  const [hint, setHint] = useState<RenderHint | null>(null)
  const [thinking, setThinking] = useState(true)
  const [minimum, setMinimum] = useState<number | null>(targets[level.id]?.minActions ?? null)
  const usedHint = useRef(false)
  const client = useRef<ReturnType<typeof prepareHints> | null>(null)
  const query = useRef(0)
  const snapshot = () => ({ steps: sim.steps(), ...sim.orbProgress(), canUndo: sim.canUndo() })
  const [hud, setHud] = useState(snapshot)
  const refresh = () => {
    const next = snapshot()
    setHud((previous) =>
      previous.steps === next.steps && previous.collected === next.collected && previous.canUndo === next.canUndo
        ? previous
        : next,
    )
  }

  useEffect(() => {
    let active = true
    let hints: ReturnType<typeof prepareHints>
    try {
      hints = prepareHints(level.id)
    } catch {
      setThinking(false)
      return
    }

    client.current = hints
    void hints.ready
      .then((value) => {
        if (active) {
          setMinimum(targets[level.id]?.minActions ?? value)
          setThinking(false)
        }
      })
      .catch(() => {
        if (active) setThinking(false)
      })
    return () => {
      active = false
      query.current++
      client.current = null
      hints.dispose()
    }
  }, [level])

  const undo = useCallback(() => {
    if (!sim.undo()) return
    query.current++
    setHint(null)
    setResult(null)
    setToast(null)
    setThinking(false)
  }, [sim])
  const requestHint = useCallback(async () => {
    if (!sim.isIdle() || sim.status === 'won' || !client.current) return
    const request = ++query.current
    const key = stateKey(sim.state())
    setThinking(true)
    try {
      const action = await client.current.next(key)
      if (query.current !== request || !sim.isIdle() || stateKey(sim.state()) !== key) return
      usedHint.current = true
      if (action) {
        setHint({ action, at: performance.now() })
        setToast(null)
      } else setToast('这条路走不通了，试试撤销')
    } catch {
      if (query.current === request) setToast('提示暂时不可用，请稍后再试')
    } finally {
      if (query.current === request) setThinking(false)
    }
  }, [sim])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        ending ||
        event.repeat ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)))
      )
        return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        undo()
      }
      if (key === 'h' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        void requestHint()
      }
      if (key === 'r' && !event.ctrlKey && !event.metaKey) onRestart()
      if (event.key === 'Escape') goSelect()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goSelect, ending, onRestart, undo, requestHint])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const onEvent = (event: SimEvent) => {
    playSimEvent(event)
    refresh()
    if (event.type === 'goal-locked') setToast(`还差 ${event.missing} 个光点`)
    if (
      event.type === 'walk-start' ||
      event.type === 'mechanism-start' ||
      event.type === 'push' ||
      event.type === 'gate'
    )
      setHint(null)
  }
  const won = () => {
    const before = useApp.getState().save
    const steps = sim.steps()
    const progress = sim.orbProgress()
    const allOrbs = progress.collected === progress.total
    completeLevel(level.id, { steps, allOrbs, usedHint: usedHint.current })
    const after = useApp.getState().save
    const newlyUnlocked = levelLists.challenge.flatMap((item, i) =>
      !isUnlocked(before, 'challenge', i) && isUnlocked(after, 'challenge', i) ? [`挑战 ${item.chapter}`] : [],
    )
    setResult({
      steps,
      ratings: { done: true, allOrbs, parMet: !usedHint.current && minimum !== null && steps <= minimum },
      unlocked: newlyUnlocked.length ? `解锁了${newlyUnlocked.join('、')}` : '',
    })
    if (level.ending) goEnding()
  }
  const hasNext = index + 1 < levelLists[list].length
  const label = list === 'challenge' ? `挑战 ${level.chapter}` : `${index + 1}`
  const message =
    !hasNext && list === 'main' ? (levelLists.main.length === 12 ? '第五章即将开放' : '后续章节即将开放') : undefined
  return (
    <div className="screen">
      <Canvas
        className="stage"
        orthographic
        shadows={settings.shadows}
        dpr={[1, settings.maxDpr]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <Scene
          level={level}
          sim={sim}
          quality={settings}
          reducedMotion={reducedMotion}
          interactive={!ending}
          hint={hint}
          onEndingReady={() => setEndingReady(true)}
          onEvent={onEvent}
          onStateChange={refresh}
          onUnreachable={() => playSound('unreachable')}
          onLanternLit={() => playSound('lantern')}
          onWon={won}
          onBlocked={setToast}
        />
      </Canvas>
      {!ending && (
        <Hud
          label={`${label} · ${level.title}`}
          steps={hud.steps}
          orbs={hud}
          muted={muted}
          canUndo={hud.canUndo}
          thinking={thinking}
          onUndo={undo}
          onHint={() => void requestHint()}
          onRestart={onRestart}
          onSelect={goSelect}
          onToggleMute={toggleMute}
        />
      )}
      {!ending && !level.challenge && level.hints && (
        <footer className="hints">
          {level.hints.map((text) => (
            <span key={text}>{text}</span>
          ))}
        </footer>
      )}
      <Toast message={toast} />
      {ending && endingReady && <Ending />}
      {result && !ending && !level.ending && (
        <CompleteBanner
          title={level.title}
          ratings={{ ...result.ratings, parMet: !usedHint.current && minimum !== null && result.steps <= minimum }}
          steps={result.steps}
          minimum={minimum}
          unlocked={result.unlocked}
          message={message}
          action={hasNext ? '下一关' : '回到选关'}
          onAction={() => (hasNext ? play(list, index + 1) : goSelect())}
          onRetry={onRestart}
        />
      )}
    </div>
  )
}
