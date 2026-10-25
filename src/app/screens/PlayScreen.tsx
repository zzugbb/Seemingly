import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSound } from '../../audio/sfx'
import { audioEngine } from '../../audio/engine'
import { music } from '../../audio/music'
import { musicStage } from '../../audio/theory'
import { stateKey } from '../../game/core/rules'
import { LevelSim, type SimEvent } from '../../game/core/sim'
import { type LevelDef } from '../../game/levels'
import { sampleTargets, targets } from '../../game/levels/targets'
import { Scene } from '../../game/render/Scene'
import type { RenderHint } from '../../game/render/feedback'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { CompleteBanner } from '../hud/CompleteBanner'
import type { RatingsValue } from '../hud/Ratings'
import { Hud } from '../hud/Hud'
import { Ending } from './Ending'
import { Toast } from '../hud/Toast'
import { isUnlocked, levelLists, useApp, type LevelList } from '../store'
import { playNewRatings, playSimEvent } from '../sounds'
import { prepareHints } from '../hints'
import { createTutorialSession, learnedTutorials, nextTutorial } from '../tutorials'
import { challengeMilestone, nextLevelIndex } from '../entry'

export function PlayScreen() {
  const current = useApp((state) => state.current)
  const level = levelLists[current.list][current.index]
  if (!level) return null
  return <LevelPlay key={`${current.list}:${level.id}`} level={level} list={current.list} index={current.index} />
}

function LevelPlay({ level, list, index }: { level: LevelDef; list: LevelList; index: number }) {
  const [runId, setRunId] = useState(0)
  const [started, setStarted] = useState(list !== 'sample')
  const restart = useCallback(() => {
    if (useApp.getState().screen === 'ending') useApp.getState().play(list, index)
    setRunId((id) => id + 1)
  }, [list, index])
  return (
    <Run
      key={runId}
      level={level}
      list={list}
      index={index}
      onRestart={restart}
      started={started}
      onStart={() => setStarted(true)}
    />
  )
}

function Run({
  level,
  list,
  index,
  onRestart,
  started,
  onStart,
}: {
  level: LevelDef
  list: LevelList
  index: number
  onRestart: () => void
  started: boolean
  onStart: () => void
}) {
  const sample = list === 'sample'
  const tactile = list === 'main' || list === 'challenge' || sample
  const ending = useApp((state) => state.screen === 'ending')
  const goSelect = useApp((state) => (sample ? state.goTitle : state.goSelect))
  const play = useApp((state) => state.play)
  const completeLevel = useApp((state) => state.completeLevel)
  const goEnding = useApp((state) => state.goEnding)
  const toggleMute = useApp((state) => state.toggleMute)
  const muted = useApp((state) => state.save.muted)
  const nextIndex = useApp((state) => nextLevelIndex(state.save, list, index))
  const quality = useApp((state) => state.quality)
  const tutorial = useApp((state) => nextTutorial(level.id, state.save))
  const learnTutorials = useApp((state) => state.learnTutorials)
  const lessons = useRef(createTutorialSession())
  const chapterPause = !sample && (level.id === 'level-09' || level.id === 'level-12')
  const [showChapterResult, setShowChapterResult] = useState(false)
  const settings = useMemo(() => qualitySettings(quality), [quality])
  const reducedMotion = prefersReducedMotion()
  const sim = useMemo(() => new LevelSim(level), [level])
  const [toast, setToast] = useState<string | null>(null)
  const [result, setResult] = useState<{
    ratings: RatingsValue
    steps: number
    unlocked: string
    message?: string
  } | null>(null)
  const [endingReady, setEndingReady] = useState(false)
  const [hint, setHint] = useState<RenderHint | null>(null)
  const [thinking, setThinking] = useState(true)
  const target = (sample ? sampleTargets : targets)[level.id]
  const [minimum, setMinimum] = useState<number | null>(target?.minActions ?? null)
  const [showSampleResult, setShowSampleResult] = useState(false)
  const [motionNotice, setMotionNotice] = useState<{ text: string; settled: boolean } | null>(null)
  const usedHint = useRef(false)
  const patrolMoving = useRef(false)
  const client = useRef<ReturnType<typeof prepareHints> | null>(null)
  const query = useRef(0)
  const snapshot = () => ({
    steps: sim.steps(),
    ...sim.orbProgress(),
    canUndo: sim.canUndo(),
    busy: !sim.isIdle(),
    walking: sim.characterPose().walking,
  })
  const [hud, setHud] = useState(snapshot)
  const refresh = () => {
    const next = snapshot()
    setHud((previous) =>
      previous.steps === next.steps &&
      previous.collected === next.collected &&
      previous.canUndo === next.canUndo &&
      previous.busy === next.busy &&
      previous.walking === next.walking
        ? previous
        : next,
    )
  }

  useEffect(() => {
    music.setProgress('explore')
    return () => {
      audioEngine.stopEffects()
      music.setProgress('explore')
    }
  }, [sim])

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
          setMinimum(target?.minActions ?? value)
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
  }, [level, target])

  useEffect(() => {
    if (!sample || !result) {
      setShowSampleResult(false)
      return
    }
    const timer = window.setTimeout(() => setShowSampleResult(true), reducedMotion ? 200 : 2200)
    return () => window.clearTimeout(timer)
  }, [sample, result, reducedMotion])

  useEffect(() => {
    if (!chapterPause || !result) {
      setShowChapterResult(false)
      return
    }
    const timer = window.setTimeout(() => setShowChapterResult(true), reducedMotion ? 200 : 2200)
    return () => window.clearTimeout(timer)
  }, [chapterPause, result, reducedMotion])

  const undo = useCallback(() => {
    if (!sim.undo()) return
    if (useApp.getState().screen === 'ending') useApp.getState().play(list, index)
    setEndingReady(false)
    audioEngine.stopEffects()
    music.setProgress(musicStage(sim.orbProgress()))
    query.current++
    setHint(null)
    setResult(null)
    setToast(null)
    setMotionNotice(null)
    setThinking(false)
  }, [sim, list, index])
  const requestHint = useCallback(async () => {
    if (!sim.isIdle() || sim.status === 'won') return
    if (!client.current) {
      setToast('提示暂时不可用，请稍后再试')
      return
    }
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
        !started ||
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
  }, [goSelect, ending, started, onRestart, undo, requestHint])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!motionNotice?.settled) return
    const timer = window.setTimeout(() => setMotionNotice(null), 1400)
    return () => window.clearTimeout(timer)
  }, [motionNotice])

  const onEvent = (event: SimEvent) => {
    const progress = sim.orbProgress()
    playSimEvent(event, level, progress)
    if (event.type === 'orb' || event.type === 'undo' || event.type === 'won')
      music.setProgress(musicStage(progress, sim.status === 'won'))
    if (list === 'main') learnTutorials(lessons.current.observe(level, event, sim.state()))
    refresh()
    if (tactile) {
      if (event.type === 'walk-start' || event.type === 'undo') setMotionNotice(null)
      if (event.type === 'mechanism-start' || event.type === 'mechanism-end') {
        setMotionNotice(mechanismNotice(level, event.id, event.type === 'mechanism-end'))
      }
    }
    if (event.type === 'patrol-move') {
      patrolMoving.current = true
      setMotionNotice({ text: '小生物正在移动', settled: false })
    }
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
    if (sample) {
      setResult({ steps, ratings: { done: true, allOrbs, parMet: false }, unlocked: '' })
      return
    }
    completeLevel(level.id, { steps, allOrbs, usedHint: usedHint.current })
    const after = useApp.getState().save
    playNewRatings(before.levels[level.id], after.levels[level.id])
    const newlyUnlocked = levelLists.challenge.flatMap((item, i) =>
      !isUnlocked(before, 'challenge', i) && isUnlocked(after, 'challenge', i) ? [`挑战 ${item.chapter}`] : [],
    )
    setResult({
      steps,
      ratings: { done: true, allOrbs, parMet: !usedHint.current && minimum !== null && steps <= minimum },
      unlocked: newlyUnlocked.length ? `解锁了${newlyUnlocked.join('、')}` : '',
      message: list === 'challenge' ? challengeMilestone(before, after) : undefined,
    })
    if (level.ending) goEnding()
  }
  const hasNext = nextIndex !== null
  const status = playStatus(tactile, hud, motionNotice)
  const footer = !result && sim.status !== 'won' ? (status ?? (list === 'main' ? tutorial : null)) : null
  const label = sample ? '独立体验' : list === 'challenge' ? `挑战 ${level.chapter}` : `${index + 1}`
  const message =
    result?.message ??
    (!hasNext && list === 'main' ? (levelLists.main.length === 12 ? '第五章即将开放' : '后续章节即将开放') : undefined)
  return (
    <div className={`screen${list === 'challenge' ? ' challenge-screen' : ''}${sample ? ' sample-screen' : ''}`}>
      <Canvas
        className="stage"
        orthographic
        shadows={settings.shadows}
        dpr={[1, settings.maxDpr]}
        gl={{ antialias: true, alpha: true, stencil: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <Scene
          level={level}
          sim={sim}
          quality={settings}
          reducedMotion={reducedMotion}
          tactile={tactile}
          interactive={!ending && started}
          hint={hint}
          onEndingReady={() => setEndingReady(true)}
          onEvent={onEvent}
          onStateChange={() => {
            refresh()
            if (sim.isIdle() && patrolMoving.current) {
              patrolMoving.current = false
              setMotionNotice({ text: '小生物已停下', settled: true })
            }
            if (list === 'main' && sim.isIdle())
              learnTutorials(lessons.current.confirm(level, sim.state(), learnedTutorials(useApp.getState().save)))
          }}
          onUnreachable={() => playSound('unreachable')}
          onTowerLit={() => playSound('finale')}
          onWon={won}
          onBlocked={(text) => setToast(blockedCopy(level, text))}
        />
      </Canvas>
      {started && (!ending || !endingReady) && (
        <Hud
          label={`${label} · ${level.title}`}
          steps={hud.steps}
          orbs={hud}
          muted={muted}
          canUndo={hud.canUndo}
          thinking={thinking}
          hintDisabled={ending}
          onUndo={undo}
          onHint={() => void requestHint()}
          onRestart={onRestart}
          onSelect={goSelect}
          onToggleMute={toggleMute}
          selectLabel={sample ? '回到标题' : undefined}
          description={
            sample
              ? `必需光点 ${hud.requiredCollected}/${hud.required} · 选做${hud.collected > hud.requiredCollected ? '已发现' : '未发现'}`
              : undefined
          }
        />
      )}
      {!ending && !sample && footer && (
        <footer className="hints" aria-live="polite">
          <span>{footer}</span>
        </footer>
      )}
      <Toast message={toast} />
      {sample && !started && (
        <section className="sample-card sample-intro" aria-label="叠庭体验说明">
          <p className="sample-eyebrow">独立体验</p>
          <h1>{level.title}</h1>
          <p>收集两束光，点亮庭院尽头的灯。</p>
          <p className="sample-caption">
            转轮转动桥臂 · 拉杆升降平台
            <br />
            点击浅色路面行走，站在平台上可以随它移动。
          </p>
          <div className="result-actions">
            <button className="hud-button" type="button" onClick={onStart}>
              走进庭院
            </button>
            <button className="hud-button" type="button" onClick={goSelect}>
              返回
            </button>
          </div>
        </section>
      )}
      {sample && started && !result && (
        <footer className="hints sample-status" aria-live="polite">
          <span>
            {status ??
              (hud.requiredCollected === hud.required ? '光已集齐，灯笼等待点亮' : '转轮转动桥臂 · 拉杆升降平台')}
          </span>
        </footer>
      )}
      {sample && result && showSampleResult && (
        <section className="sample-card sample-result" aria-label="叠庭体验完成" aria-live="polite">
          <p className="sample-eyebrow">{result.ratings.allOrbs ? '全部光点已找到' : '庭院已点亮'}</p>
          <h2>{result.ratings.allOrbs ? '每一束光，都回到了庭院' : '灯亮了，回廊也有了新的模样'}</h2>
          <p>
            {result.ratings.allOrbs ? '你也探索了上层侧翼，找到了远处的光。' : '远处还有一束选做的光，等待下一次探索。'}
          </p>
          <p className="sample-caption">本次行走与操作共 {result.steps} 步</p>
          <div className="result-actions">
            <button className="hud-button" type="button" onClick={onRestart}>
              再探索一次
            </button>
            <button className="hud-button" type="button" onClick={goSelect}>
              回到标题
            </button>
          </div>
        </section>
      )}
      {ending && endingReady && <Ending />}
      {result && !sample && !ending && !level.ending && (!chapterPause || showChapterResult) && (
        <CompleteBanner
          title={level.title}
          ratings={{ ...result.ratings, parMet: !usedHint.current && minimum !== null && result.steps <= minimum }}
          usedHint={usedHint.current}
          steps={result.steps}
          minimum={minimum}
          unlocked={result.unlocked}
          message={message}
          action={hasNext ? '下一关' : '回到选关'}
          onAction={() => (nextIndex !== null ? play(list, nextIndex) : goSelect())}
          onRetry={onRestart}
        />
      )}
    </div>
  )
}

function blockedCopy(level: LevelDef, text: string): string {
  if (!text.includes('换个角度')) return text
  const adjustable = level.mechanisms.some((item) => item.type === 'rotator' || item.type === 'mover')
  if (adjustable) return '这里还没连通，试试调整建筑'
  if (level.mechanisms.length === 0) return '这里还没连通'
  return text
}

function playStatus(
  tactile: boolean,
  hud: { busy: boolean; walking: boolean },
  notice: { text: string; settled: boolean } | null,
): string | null {
  if (!tactile) return null
  if (hud.busy) return hud.walking ? '正在前往路面' : (notice?.text ?? '建筑正在移动')
  return notice?.text ?? null
}

function mechanismNotice(level: LevelDef, id: string, settled: boolean): { text: string; settled: boolean } {
  const mechanism = level.mechanisms.find((item) => item.id === id)
  const name =
    mechanism?.type === 'rotator' ? '桥臂' : mechanism?.type === 'mover' && mechanism.axis !== 'y' ? '运输台' : '升降台'
  return { text: settled ? `${name}已到位` : `${name}${name === '桥臂' ? '转动' : '移动'}中`, settled }
}
