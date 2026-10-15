import { useEffect, useState } from 'react'
import { ambient } from '../audio/ambient'
import { audioEngine } from '../audio/engine'
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
  useEffect(() => {
    let active = true
    audioEngine.setMuted(useApp.getState().save.muted)
    const unsubscribe = useApp.subscribe((state, previous) => {
      if (state.save.muted !== previous.save.muted) {
        audioEngine.setMuted(state.save.muted)
        ambient.sync(audioEngine.getBus())
      }
    })
    const unlock = (event: Event) => {
      if (event.isTrusted) {
        void audioEngine.unlock().then(() => {
          if (active) ambient.sync(audioEngine.getBus())
        })
      }
    }
    window.addEventListener('click', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      active = false
      ambient.stop()
      unsubscribe()
      window.removeEventListener('click', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }, [])
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
  if (screen === 'play' || screen === 'ending')
    return (
      <div className="app">
        <PlayScreen />
      </div>
    )
  return (
    <div className="app">
      <TitleScreen />
    </div>
  )
}
