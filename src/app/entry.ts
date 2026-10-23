import { mainLevels } from '../game/levels'
import type { LevelDef } from '../game/levels/types'
import type { SaveData } from './save'
import { firstPlayableIndex, isUnlocked } from './store'

export interface CampaignStats {
  mainDone: number
  mainCount: number
  earned: number
  ratingMax: number
  showProgress: boolean
}

export type JourneyMode = 'start' | 'continue' | 'revisit'

export interface JourneyChoice {
  mode: JourneyMode
  label: string
  caption: string
  index: number
}

export const ratingCount = (record: Pick<SaveData['levels'][string], 'done' | 'allOrbs' | 'parMet'> | undefined) =>
  Number(Boolean(record?.done)) + Number(Boolean(record?.allOrbs)) + Number(Boolean(record?.parMet))

export function campaignStats(
  save: SaveData,
  main: readonly Pick<LevelDef, 'id'>[] = mainLevels,
  challenge: readonly Pick<LevelDef, 'id'>[] = [],
): CampaignStats {
  const formal = [...main, ...challenge]
  const earned = formal.reduce((count, level) => count + ratingCount(save.levels[level.id]), 0)
  const mainDone = main.filter((level) => save.levels[level.id]?.done).length
  return {
    mainDone,
    mainCount: main.length,
    earned,
    ratingMax: formal.length * 3,
    showProgress: mainDone > 0 || earned > 0,
  }
}

export function journeyChoice(save: SaveData, main: readonly LevelDef[] = mainLevels): JourneyChoice {
  const index = firstPlayableIndex(save)
  const done = main.filter((level) => save.levels[level.id]?.done).length
  const level = main[index]
  if (done === 0) {
    return { mode: 'start', label: '开始旅程', caption: `前往 第 1 关 · ${main[0]?.title ?? ''}`, index }
  }
  if (done < main.length) {
    return {
      mode: 'continue',
      label: '继续旅程',
      caption: `前往 第 ${index + 1} 关 · ${level?.title ?? ''}`,
      index,
    }
  }
  return { mode: 'revisit', label: '重访旅程', caption: '当前开放的关卡已全部抵达', index }
}

export const levelThemes: Readonly<Record<string, string>> = {
  'level-01': '第一束光',
  'level-02': '改变连接',
  'level-03': '随建筑移动',
  'level-04': '庭院之间',
  'level-05': '层叠的庭院',
  'level-06': '两座桥的回程',
  'level-07': '在停靠之间取舍',
  'level-08': '两处转轮，共用一座远桥',
  'level-09': '召来远台，再恢复归路',
  'level-10': '把箱留下，人再回来',
  'level-11': '转过桥，再换推向',
  'level-12': '把重量留下，把自己送回',
}

export type SelectStatus = 'locked' | 'done' | 'next' | 'open'

export function selectStatus(
  save: SaveData,
  index: number,
  main: readonly LevelDef[] = mainLevels,
): { status: SelectStatus; label: string } {
  const level = main[index]
  if (!level) return { status: 'locked', label: '' }
  const unlocked = isUnlocked(save, 'main', index)
  const done = Boolean(save.levels[level.id]?.done)
  const finished = main.every((item) => save.levels[item.id]?.done)
  if (!unlocked) {
    const reason = `先通过第 ${index} 关`
    return { status: 'locked', label: done ? `已抵达 · ${reason}` : reason }
  }
  if (done) return { status: 'done', label: '已抵达' }
  if (!finished && index === firstPlayableIndex(save)) return { status: 'next', label: '下一站' }
  return { status: 'open', label: '可探索' }
}

export function initialPreviewIndex(save: SaveData): number {
  const preferred = firstPlayableIndex(save)
  if (isUnlocked(save, 'main', preferred)) return preferred
  const fallback = mainLevels.findIndex((_, index) => isUnlocked(save, 'main', index))
  return Math.max(0, fallback)
}

export function chapterArrival(save: SaveData, chapter: number, main: readonly LevelDef[] = mainLevels) {
  const levels = main.filter((level) => level.chapter === chapter)
  return { done: levels.filter((level) => save.levels[level.id]?.done).length, total: levels.length }
}
