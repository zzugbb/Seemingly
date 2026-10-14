import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { LevelSim } from '../game/core/sim'
import { level } from '../game/levels/prototype'
import { Scene } from '../game/render/Scene'

export function App() {
  const [runId, setRunId] = useState(0)
  const [reached, setReached] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const restart = () => {
    setReached(false)
    setRunId((id) => id + 1)
  }

  const sim = useMemo(() => new LevelSim(level), [runId])

  return (
    <div className="app">
      <Canvas
        className="stage"
        orthographic
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <Scene key={runId} level={level} sim={sim} onWon={() => setReached(true)} onBlocked={showToast} />
      </Canvas>

      <header className="title">
        <h1>Seemingly</h1>
        <p>积木错位 · 画面小样</p>
      </header>

      <button className="restart" type="button" onClick={restart}>
        重新开始
      </button>

      <footer className="hints">
        <span>点击路面，小人会走过去</span>
        <span>点击金色转轮，旋转桥梁</span>
        <span>看起来连着，就能走过去</span>
      </footer>

      {toast && <div className="toast">{toast}</div>}

      {reached && (
        <div className="result">
          <div className="result-card">
            <h2>抵达</h2>
            <p>路并不相连，只是看起来相连。</p>
            <button type="button" onClick={restart}>
              再走一次
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
