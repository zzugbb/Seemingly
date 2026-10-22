import { useEffect, useState } from 'react'
import { music } from '../audio/music'
import { audioEngine } from '../audio/engine'
import { LevelSelect } from './screens/LevelSelect'
import { PlayScreen } from './screens/PlayScreen'
import { TitleScreen } from './screens/TitleScreen'
import { levelLists, useApp } from './store'

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
    const sync = () => {
      const state = useApp.getState()
      const level = state.screen === 'title' ? levelLists.main[0] : levelLists[state.current.list][state.current.index]
      const chapter = level?.chapter ?? 1
      const challenge = (state.screen === 'play' || state.screen === 'ending') && state.current.list === 'challenge'
      const soundtrack = level?.soundtrack
      if (state.screen !== 'play' && state.screen !== 'ending') music.setProgress('explore')
      audioEngine.setMuted(state.save.muted)
      if (state.save.muted) music.stop()
      else music.start(chapter, challenge, soundtrack ?? 'generative')
    }
    sync()
    const unsubscribe = useApp.subscribe((state, previous) => {
      if (
        state.save.muted !== previous.save.muted ||
        state.current !== previous.current ||
        state.screen !== previous.screen
      ) {
        if (state.current !== previous.current || (state.screen !== previous.screen && state.screen !== 'ending'))
          audioEngine.stopEffects()
        sync()
      }
    })
    const unlock = (event: Event) => {
      if (event.isTrusted) {
        void audioEngine.unlock().then(() => {
          if (active) sync()
        })
      }
    }
    window.addEventListener('click', unlock, true)
    window.addEventListener('keydown', unlock, true)
    return () => {
      active = false
      music.stop()
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
