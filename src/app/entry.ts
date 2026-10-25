import { challengeLevels, mainLevels } from '../game/levels'
import type { LevelDef } from '../game/levels/types'
import type { SaveData } from './save'
import { firstPlayableIndex, isUnlocked, levelLists, type LevelList } from './store'

export interface CampaignStats {
  mainDone: number
  mainCount: number
  challengeDone: number
  challengeCount: number
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
  challenge: readonly Pick<LevelDef, 'id'>[] = challengeLevels,
): CampaignStats {
  const formal = [...main, ...challenge]
  const earned = formal.reduce((count, level) => count + ratingCount(save.levels[level.id]), 0)
  const mainDone = main.filter((level) => save.levels[level.id]?.done).length
  return {
    mainDone,
    mainCount: main.length,
    challengeDone: challenge.filter((level) => save.levels[level.id]?.done).length,
    challengeCount: challenge.length,
    earned,
    ratingMax: formal.length * 3,
    showProgress: mainDone > 0 || earned > 0,
  }
}

export function journeyChoice(
  save: SaveData,
  main: readonly LevelDef[] = mainLevels,
  challenge: readonly LevelDef[] = challengeLevels,
): JourneyChoice {
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
  const stats = campaignStats(save, main, challenge)
  const caption = stats.earned === stats.ratingMax ? '全部关卡与评价已完成' : '主线关卡已全部抵达'
  return { mode: 'revisit', label: '重访旅程', caption, index }
}

export function challengeMilestone(before: SaveData, after: SaveData): string | undefined {
  const completed = (save: SaveData) =>
    challengeLevels.length > 0 && challengeLevels.every((level) => save.levels[level.id]?.done)
  return !completed(before) && completed(after) ? '全部挑战已抵达' : undefined
}

export function nextLevelIndex(save: SaveData, list: LevelList, index: number): number | null {
  if (list === 'sample' || !levelLists[list][index] || !isUnlocked(save, list, index + 1)) return null
  return index + 1
}

export const levelThemes: Readonly<Record<string, string>> = {
  'challenge-1': '三庭的回访顺序',
  'challenge-2': '两端错开的渡台',
  'challenge-3': '同桥的正反控制',
  'challenge-4': '同一个箱的三次交接',
  'challenge-5': '运回重量，让出站位',
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
  'level-11': '先开出口，再换推向',
  'level-12': '中站留箱，远庭取光',
  'level-13': '移台留住重量，再借空台引它换板',
  'level-14': '箱子挡回路，小生物守另一块板',
  'level-15': '去时各守一门，回来交换职责',
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
