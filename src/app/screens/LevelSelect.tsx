import { challengeLevels, mainLevels } from '../../game/levels'
import { Ratings } from '../hud/Ratings'
import { isUnlocked, useApp, type LevelList } from '../store'

const chapterNames = ['看似', '转动', '升起', '推动', '遮挡']
const numerals = ['一', '二', '三', '四', '五']
export function LevelSelect() {
  const goTitle = useApp((state) => state.goTitle)
  const play = useApp((state) => state.play)
  const save = useApp((state) => state.save)
  const cards = (list: LevelList, chapter?: number) =>
    (list === 'main' ? mainLevels : challengeLevels).map((level, index) => {
      if (chapter !== undefined && level.chapter !== chapter) return null
      const unlocked = isUnlocked(save, list, index)
      return (
        <button
          key={level.id}
          className="level-card"
          type="button"
          disabled={!unlocked}
          onClick={() => play(list, index)}
        >
          <span className="level-index">{list === 'challenge' ? `挑战 ${level.chapter}` : index + 1}</span>
          <span className="level-name">{level.title}</span>
          <Ratings value={save.levels[level.id]} />
          {list === 'challenge' && !unlocked && (
            <small>{level.chapter === 1 ? '通关第一章' : `集齐第${numerals[level.chapter - 1]}章选做光点`}</small>
          )}
        </button>
      )
    })
  return (
    <div className="screen select-screen">
      <button className="hud-button back" type="button" onClick={goTitle}>
        返回
      </button>
      <main className="chapter-list">
        {chapterNames.map(
          (name, index) =>
            mainLevels.some((level) => level.chapter === index + 1) && (
              <section key={name}>
                <h1>
                  第{numerals[index]}章 · {name}
                </h1>
                <div className="level-list">{cards('main', index + 1)}</div>
              </section>
            ),
        )}
        {challengeLevels.length > 0 && (
          <section>
            <h1>挑战章</h1>
            <div className="level-list">{cards('challenge')}</div>
          </section>
        )}
      </main>
    </div>
  )
}
