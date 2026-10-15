import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { LevelSim } from '../../game/core/sim'
import { levels } from '../../game/levels'
import { Scene } from '../../game/render/Scene'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { CompleteBanner } from '../hud/CompleteBanner'
import { Hud } from '../hud/Hud'
import { Ending } from './Ending'
import { Toast } from '../hud/Toast'
import { useApp } from '../store'

export function PlayScreen() {
  const ending = useApp((state) => state.screen === 'ending')
  const levelIndex = useApp((state) => state.levelIndex)
  const goSelect = useApp((state) => state.goSelect)
  const play = useApp((state) => state.play)
  const completeLevel = useApp((state) => state.completeLevel)
  const goEnding = useApp((state) => state.goEnding)
  const toggleMute = useApp((state) => state.toggleMute)
  const muted = useApp((state) => state.save.muted)
  const settings = qualitySettings(useApp((state) => state.quality))
  const reducedMotion = prefersReducedMotion()
  const level = levels[levelIndex] ?? levels[0]!
  const [runId, setRunId] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [endingReady, setEndingReady] = useState(false)
  const sim = useMemo(() => new LevelSim(level), [level, runId])

  const restart = () => {
    setWon(false)
    setEndingReady(false)
    setToast(null)
    setRunId((id) => id + 1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (ending) return
      if (event.key === 'r' || event.key === 'R') restart()
      if (event.key === 'Escape') goSelect()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goSelect, ending])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

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
          key={`${level.id}:${runId}`}
          level={level}
          sim={sim}
          quality={settings}
          reducedMotion={reducedMotion}
          interactive={!ending}
          onEndingReady={() => setEndingReady(true)}
          onWon={() => {
            setWon(true)
            completeLevel(level.id)
            if (level.ending) goEnding()
          }}
          onBlocked={setToast}
        />
      </Canvas>
      {!ending && (
        <Hud
          label={`${levelIndex === 0 ? '序章' : levelIndex} · ${level.title}`}
          muted={muted}
          onRestart={restart}
          onSelect={goSelect}
          onToggleMute={toggleMute}
        />
      )}
      {!ending && level.hints && (
        <footer className="hints">
          {level.hints.map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </footer>
      )}
      <Toast message={toast} />
      {ending && endingReady && <Ending />}
      {won && !ending && !level.ending && (
        <CompleteBanner
          title={level.title}
          action="下一关"
          onAction={() => {
            setWon(false)
            play(levelIndex + 1)
          }}
        />
      )}
    </div>
  )
}
