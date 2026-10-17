import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { LevelSim } from '../../game/core/sim'
import { levels, challengeLevels } from '../../game/levels'
import { Scene } from '../../game/render/Scene'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { Ratings } from '../hud/Ratings'
import { firstPlayableIndex, useApp } from '../store'

export function TitleScreen() {
  const play = useApp((state) => state.play)
  const goSelect = useApp((state) => state.goSelect)
  const save = useApp((state) => state.save)
  const available = [...levels, ...challengeLevels]
  const total = available.reduce((count, level) => {
    const record = save.levels[level.id]
    return count + Number(Boolean(record?.done)) + Number(Boolean(record?.allOrbs)) + Number(Boolean(record?.parMet))
  }, 0)
  const settings = qualitySettings(useApp((state) => state.quality))
  const reducedMotion = prefersReducedMotion()
  const sim = useMemo(() => new LevelSim(levels[0]!), [])
  const level = levels[0]!

  return (
    <div className="screen">
      <Canvas
        className="stage"
        orthographic
        shadows={settings.shadows}
        dpr={[1, settings.maxDpr]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
      >
        <Scene
          level={level}
          sim={sim}
          interactive={false}
          quality={settings}
          reducedMotion={reducedMotion}
          onWon={() => undefined}
          onBlocked={() => undefined}
        />
      </Canvas>
      <div className="title-center">
        <h1>Seemingly</h1>
        <p>积木错位</p>
        <div className="rating-total">
          <Ratings value={{ done: true, allOrbs: true, parMet: true }} />
          <span>
            已点亮 {total} / {available.length * 3}
          </span>
        </div>
        <div className="title-actions">
          <button type="button" onClick={() => play('main', firstPlayableIndex(save))}>
            开始
          </button>
          <button type="button" onClick={goSelect}>
            选关
          </button>
        </div>
      </div>
    </div>
  )
}
