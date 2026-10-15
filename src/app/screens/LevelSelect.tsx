import { levels } from '../../game/levels'
import { isUnlocked, useApp } from '../store'

export function LevelSelect() {
  const goTitle = useApp((state) => state.goTitle)
  const play = useApp((state) => state.play)
  const completed = useApp((state) => state.save.completed)

  return (
    <div className="screen select-screen">
      <button className="hud-button back" type="button" onClick={goTitle}>
        返回
      </button>
      <div className="level-list">
        {levels.map((level, index) => {
          const unlocked = isUnlocked(index, completed)
          const done = completed.includes(level.id)
          return (
            <button
              key={level.id}
              className="level-card"
              type="button"
              disabled={!unlocked}
              onClick={() => play(index)}
            >
              <span className={done ? 'lantern lit' : 'lantern'} aria-hidden="true" />
              <span className="level-index">{index === 0 ? '序章' : index}</span>
              <span className="level-name">{level.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
