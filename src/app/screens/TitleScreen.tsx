import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { challengeLevels, mainLevels } from '../../game/levels'
import { LevelSim } from '../../game/core/sim'
import { Scene } from '../../game/render/Scene'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { campaignStats, journeyChoice } from '../entry'
import { useApp } from '../store'

export function TitleScreen() {
  const play = useApp((state) => state.play)
  const goSelect = useApp((state) => state.goSelect)
  const toggleMute = useApp((state) => state.toggleMute)
  const save = useApp((state) => state.save)
  const settings = qualitySettings(useApp((state) => state.quality))
  const reducedMotion = prefersReducedMotion()
  const level = mainLevels[0]!
  const sim = useMemo(() => new LevelSim(level), [level])
  const stats = campaignStats(save, mainLevels, challengeLevels)
  const journey = journeyChoice(save, mainLevels)
  const begin = () => {
    if (journey.mode === 'revisit') goSelect()
    else play('main', journey.index)
  }

  return (
    <div className="entry-title">
      <button className="entry-mute" type="button" aria-pressed={save.muted} onClick={toggleMute}>
        {save.muted ? '取消静音' : '静音'}
      </button>
      <div className="entry-title-layout">
        <div className="entry-copy">
          <p className="entry-brand">Seemingly</p>
          <h1>积木错位</h1>
          <p className="entry-tagline">路看似相连，就能走过去。</p>
          {stats.showProgress && (
            <p className="entry-progress">
              主线已抵达 {stats.mainDone}/{stats.mainCount} · 已获评价 {stats.earned}/{stats.ratingMax}
            </p>
          )}
          <button className="entry-primary" type="button" onClick={begin}>
            {journey.label}
          </button>
          <p className="entry-caption">{journey.caption}</p>
          <button className="entry-secondary" type="button" onClick={goSelect}>
            选择关卡
          </button>
        </div>
        <div className="entry-stage" aria-hidden="true">
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
              tactile={false}
              quality={settings}
              reducedMotion={reducedMotion}
              onWon={() => undefined}
              onBlocked={() => undefined}
            />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
