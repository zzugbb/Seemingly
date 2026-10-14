import { create } from 'zustand'
import { levels } from '../game/levels'
import { detectQuality } from '../game/render/quality'
import { loadSave, writeSave, type SaveData } from './save'

export type Screen = 'title' | 'select' | 'play' | 'ending'

interface AppState {
  screen: Screen
  levelIndex: number
  save: SaveData
  quality: 'high' | 'low'
  goTitle: () => void
  goSelect: () => void
  goEnding: () => void
  play: (levelIndex: number) => void
  completeLevel: (id: string) => void
  toggleMute: () => void
}

export const useApp = create<AppState>((set, get) => ({
  screen: 'title',
  levelIndex: 0,
  save: loadSave(),
  quality: detectQuality(),
  goTitle: () => set({ screen: 'title' }),
  goSelect: () => set({ screen: 'select' }),
  goEnding: () => set({ screen: 'ending' }),
  play: (levelIndex) => set({ screen: 'play', levelIndex }),
  completeLevel: (id) => {
    const save = get().save
    if (save.completed.includes(id)) return
    const next = { ...save, completed: [...save.completed, id] }
    writeSave(next)
    set({ save: next })
  },
  toggleMute: () => {
    const next = { ...get().save, muted: !get().save.muted }
    writeSave(next)
    set({ save: next })
  },
}))

export function firstPlayableIndex(completed: readonly string[]): number {
  const index = levels.findIndex((level) => !completed.includes(level.id))
  return index === -1 ? Math.max(0, levels.length - 1) : index
}

export function isUnlocked(index: number, completed: readonly string[]): boolean {
  if (index <= 0) return true
  const previous = levels[index - 1]
  return previous ? completed.includes(previous.id) : false
}
