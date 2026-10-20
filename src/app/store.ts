import { create } from 'zustand'
import { challengeLevels, mainLevels, sampleLevels, type LevelDef } from '../game/levels'
import { targets } from '../game/levels/targets'
import { detectQuality } from '../game/render/quality'
import { loadSave, writeSave, type SaveData } from './save'

export type Screen = 'title' | 'select' | 'play' | 'ending'
export type LevelList = 'main' | 'challenge' | 'sample'
export const levelLists = { main: mainLevels, challenge: challengeLevels, sample: sampleLevels }

const sampleEntry = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sample') === '1'

interface AppState {
  screen: Screen
  current: { list: LevelList; index: number }
  save: SaveData
  quality: 'high' | 'low'
  goTitle: () => void
  goSelect: () => void
  goEnding: () => void
  play: (list: LevelList, index: number) => void
  completeLevel: (id: string, result: { steps: number; allOrbs: boolean; usedHint: boolean }) => void
  toggleMute: () => void
}

export const useApp = create<AppState>((set, get) => ({
  screen: sampleEntry ? 'play' : 'title',
  current: { list: sampleEntry ? 'sample' : 'main', index: 0 },
  save: loadSave(),
  quality: detectQuality(),
  goTitle: () => set({ screen: 'title' }),
  goSelect: () => set({ screen: 'select' }),
  goEnding: () => set({ screen: 'ending' }),
  play: (list, index) => {
    if (isUnlocked(get().save, list, index)) set({ screen: 'play', current: { list, index } })
  },
  completeLevel: (id, result) => {
    const level = [...mainLevels, ...challengeLevels].find((item) => item.id === id)
    if (!level || !Number.isSafeInteger(result.steps) || result.steps < 0) return
    const save = get().save
    const previous = save.levels[id]
    const minimum = targets[id]?.minActions
    const next: SaveData = {
      ...save,
      levels: {
        ...save.levels,
        [id]: {
          done: true,
          allOrbs: Boolean(previous?.allOrbs || result.allOrbs),
          bestSteps: Math.min(previous?.bestSteps ?? Infinity, result.steps),
          parMet: Boolean(previous?.parMet || (!result.usedHint && minimum !== undefined && result.steps <= minimum)),
        },
      },
    }
    writeSave(next)
    set({ save: next })
  },
  toggleMute: () => {
    const next = { ...get().save, muted: !get().save.muted }
    writeSave(next)
    set({ save: next })
  },
}))

export function firstPlayableIndex(save: SaveData): number {
  const index = mainLevels.findIndex((level) => !save.levels[level.id]?.done)
  return index === -1 ? Math.max(0, mainLevels.length - 1) : index
}

export function isUnlocked(
  save: SaveData,
  list: LevelList,
  index: number,
  lists: Record<LevelList, readonly LevelDef[]> = levelLists,
): boolean {
  const level = lists[list][index]
  if (!level) return false
  if (list === 'sample') return true
  if (list === 'main') return index === 0 || Boolean(save.levels[lists.main[index - 1]?.id]?.done)
  const chapter = lists.main.filter((item) => item.chapter === level.chapter)
  return (
    chapter.length > 0 &&
    chapter.every((item) => (level.chapter === 1 ? save.levels[item.id]?.done : save.levels[item.id]?.allOrbs))
  )
}
