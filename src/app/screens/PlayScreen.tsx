import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { LevelSim } from '../../game/core/sim'
import { levels } from '../../game/levels'
import { Scene } from '../../game/render/Scene'
import { CompleteBanner } from '../hud/CompleteBanner'
import { Hud } from '../hud/Hud'
import { Toast } from '../hud/Toast'
import { useApp } from '../store'

const TEACHING_HINTS = ['点击路面，小人会走过去', '点击金色转轮，旋转桥梁', '看起来连着，就能走过去']

export function PlayScreen() {
  const levelIndex = useApp((state) => state.levelIndex)
  const goSelect = useApp((state) => state.goSelect)
  const play = useApp((state) => state.play)
  const completeLevel = useApp((state) => state.completeLevel)
  const goEnding = useApp((state) => state.goEnding)
  const toggleMute = useApp((state) => state.toggleMute)
  const muted = useApp((state) => state.save.muted)
  const level = levels[levelIndex] ?? levels[0]!
  const [runId, setRunId] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const sim = useMemo(() => new LevelSim(level), [level, runId])
  const hasNext = levelIndex + 1 < levels.length

  const restart = () => {
    setWon(false)
    setToast(null)
    setRunId((id) => id + 1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'r' || event.key === 'R') restart()
      if (event.key === 'Escape') goSelect()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goSelect])

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
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <Scene
          key={runId}
          level={level}
          sim={sim}
          onWon={() => {
            setWon(true)
            completeLevel(level.id)
          }}
          onBlocked={setToast}
        />
      </Canvas>
      <Hud
        label={`${levelIndex + 1} · ${level.title}`}
        muted={muted}
        onRestart={restart}
        onSelect={goSelect}
        onToggleMute={toggleMute}
      />
      {levelIndex <= 2 && (
        <footer className="hints">
          {(level.hints ?? TEACHING_HINTS).map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </footer>
      )}
      <Toast message={toast} />
      {won && (
        <CompleteBanner
          title={level.title}
          action={hasNext ? '下一关' : '结尾'}
          onAction={() => {
            setWon(false)
            if (hasNext) play(levelIndex + 1)
            else goEnding()
          }}
        />
      )}
    </div>
  )
}
