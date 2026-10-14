import { Ending } from './screens/Ending'
import { LevelSelect } from './screens/LevelSelect'
import { PlayScreen } from './screens/PlayScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useApp } from './store'

export function App() {
  const screen = useApp((state) => state.screen)
  if (screen === 'select')
    return (
      <div className="app">
        <LevelSelect />
      </div>
    )
  if (screen === 'play')
    return (
      <div className="app">
        <PlayScreen />
      </div>
    )
  if (screen === 'ending')
    return (
      <div className="app">
        <Ending />
      </div>
    )
  return (
    <div className="app">
      <TitleScreen />
    </div>
  )
}
