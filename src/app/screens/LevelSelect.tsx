import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { challengeLevels, mainLevels } from '../../game/levels'
import { LevelSim } from '../../game/core/sim'
import { Scene } from '../../game/render/Scene'
import { prefersReducedMotion, qualitySettings } from '../../game/render/quality'
import { Ratings } from '../hud/Ratings'
import { campaignStats, chapterArrival, initialPreviewIndex, levelThemes, ratingCount, selectStatus } from '../entry'
import { targets } from '../../game/levels/targets'
import { isUnlocked, useApp } from '../store'

const chapterNames = ['看似', '转动', '升起', '推动', '遮挡']
const numerals = ['一', '二', '三', '四', '五']

function useDesktopPreview() {
  const query = '(min-width: 960px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setWide(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return wide
}

export function LevelSelect() {
  const goTitle = useApp((state) => state.goTitle)
  const play = useApp((state) => state.play)
  const toggleMute = useApp((state) => state.toggleMute)
  const save = useApp((state) => state.save)
  const wide = useDesktopPreview()
  const [preview, setPreview] = useState<{ list: 'main' | 'challenge'; index: number }>(() => ({
    list: 'main',
    index: initialPreviewIndex(save),
  }))
  const stats = campaignStats(save, mainLevels, challengeLevels)
  const settings = qualitySettings(useApp((state) => state.quality))
  const reducedMotion = prefersReducedMotion()
  const previewLevel = (preview.list === 'main' ? mainLevels : challengeLevels)[preview.index] ?? mainLevels[0]!
  const sim = useMemo(() => new LevelSim(previewLevel), [previewLevel])
  const show = (list: 'main' | 'challenge', index: number) => {
    if (isUnlocked(save, list, index))
      setPreview((previous) => (previous.list === list && previous.index === index ? previous : { list, index }))
  }

  return (
    <div className="entry-select">
      <div className="entry-select-frame">
        <div className="entry-select-tools">
          <button className="entry-tool" type="button" onClick={goTitle}>
            返回标题
          </button>
          <button className="entry-tool" type="button" aria-pressed={save.muted} onClick={toggleMute}>
            {save.muted ? '取消静音' : '静音'}
          </button>
        </div>
        <div className="entry-select-body">
          <div className="entry-select-main">
            <h1>选择关卡</h1>
            {stats.showProgress && (
              <p className="entry-progress">
                主线已抵达 {stats.mainDone}/{stats.mainCount} · 已获评价 {stats.earned}/{stats.ratingMax}
              </p>
            )}
            {chapterNames.map((name, chapterIndex) => {
              const chapter = chapterIndex + 1
              const levels = mainLevels.filter((level) => level.chapter === chapter)
              if (levels.length === 0) return null
              const arrival = chapterArrival(save, chapter)
              return (
                <section className="entry-chapter" key={name}>
                  <div className="entry-chapter-head">
                    <h2>
                      第{numerals[chapterIndex]}章 · {name}
                    </h2>
                    <span>
                      {arrival.done}/{arrival.total} 关已抵达
                    </span>
                  </div>
                  <div className="entry-cards">
                    {mainLevels.map((level, index) => {
                      if (level.chapter !== chapter) return null
                      const status = selectStatus(save, index)
                      const theme = levelThemes[level.id]
                      return (
                        <button
                          key={level.id}
                          className={`entry-card entry-card-${status.status}`}
                          type="button"
                          disabled={status.status === 'locked'}
                          onMouseEnter={() => show('main', index)}
                          onFocus={() => show('main', index)}
                          onClick={() => play('main', index)}
                        >
                          <span className="entry-card-heading">
                            <span className="entry-card-index">{String(index + 1).padStart(2, '0')}</span>
                            <span
                              className="entry-card-count"
                              aria-label={`已获评价 ${ratingCount(save.levels[level.id])}/3`}
                            >
                              {ratingCount(save.levels[level.id])}/3
                            </span>
                          </span>
                          <span className="entry-card-name">{level.title}</span>
                          {theme && <span className="entry-card-theme">{theme}</span>}
                          <Ratings value={save.levels[level.id]} minimum={targets[level.id]?.minActions} />
                          {status.status !== 'done' && <span className="entry-card-status">{status.label}</span>}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
            {challengeLevels.length > 0 && (
              <section className="entry-chapter">
                <div className="entry-chapter-head">
                  <h2>挑战章</h2>
                </div>
                <div className="entry-cards">
                  {challengeLevels.map((level, index) => {
                    const unlocked = isUnlocked(save, 'challenge', index)
                    return (
                      <button
                        key={level.id}
                        className={`entry-card${unlocked ? '' : ' entry-card-locked'}`}
                        type="button"
                        disabled={!unlocked}
                        onMouseEnter={() => show('challenge', index)}
                        onFocus={() => show('challenge', index)}
                        onClick={() => play('challenge', index)}
                      >
                        <span className="entry-card-heading">
                          <span className="entry-card-index">挑战 {level.chapter}</span>
                          <span
                            className="entry-card-count"
                            aria-label={`已获评价 ${ratingCount(save.levels[level.id])}/3`}
                          >
                            {ratingCount(save.levels[level.id])}/3
                          </span>
                        </span>
                        <span className="entry-card-name">{level.title}</span>
                        <span className="entry-card-theme">{levelThemes[level.id]}</span>
                        <Ratings value={save.levels[level.id]} minimum={targets[level.id]?.minActions} />
                        {!unlocked && (
                          <span className="entry-card-status">
                            {level.chapter === 1 ? '通关第一章' : `集齐第${numerals[level.chapter - 1]}章选做光点`}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
          {wide && (
            <aside className="entry-preview">
              <div className="entry-preview-stage" aria-hidden="true">
                <Canvas
                  className="stage"
                  orthographic
                  shadows={settings.shadows}
                  dpr={[1, settings.maxDpr]}
                  gl={{ antialias: true, alpha: true }}
                  camera={{ position: [30, 30, 30], zoom: 40 }}
                >
                  <Scene
                    key={previewLevel.id}
                    level={previewLevel}
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
              <div className="entry-preview-copy" key={previewLevel.id}>
                <p>
                  {preview.list === 'challenge' ? `挑战 ${previewLevel.chapter}` : `第 ${preview.index + 1} 关`} ·{' '}
                  {previewLevel.title}
                </p>
                {levelThemes[previewLevel.id] && <p>{levelThemes[previewLevel.id]}</p>}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
