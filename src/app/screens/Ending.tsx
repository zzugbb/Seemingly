import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { LevelSim } from '../../game/core/sim'
import { levels } from '../../game/levels'
import { Scene } from '../../game/render/Scene'
import { useApp } from '../store'

export function Ending() {
  const goTitle = useApp((state) => state.goTitle)
  const level = levels[0]!
  const sim = useMemo(() => new LevelSim(level), [level])

  return (
    <div className="screen">
      <Canvas
        className="stage"
        orthographic
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
      >
        <Scene level={level} sim={sim} interactive={false} onWon={() => undefined} onBlocked={() => undefined} />
      </Canvas>
      <div className="title-center">
        <h1>谢谢游玩</h1>
        <div className="title-actions">
          <button type="button" onClick={goTitle}>
            回到标题
          </button>
        </div>
      </div>
    </div>
  )
}
