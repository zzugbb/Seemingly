import { useState } from 'react'
import { Ending } from './screens/Ending'
import { LevelSelect } from './screens/LevelSelect'
import { PlayScreen } from './screens/PlayScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useApp } from './store'

function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

export function App() {
  const [supported] = useState(hasWebGL2)
  const screen = useApp((state) => state.screen)
  if (!supported) {
    return (
      <div className="app">
        <p className="unsupported">当前浏览器不支持 WebGL2，无法运行这款游戏。</p>
      </div>
    )
  }
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
