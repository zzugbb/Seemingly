import { mainLevels, challengeLevels } from '../game/levels'
import { campaignStats } from './entry'
import type { SaveData } from './save'

export function journeyStats(save: SaveData) {
  const stats = campaignStats(save)
  const levels = [...mainLevels, ...challengeLevels]
  const allOrbs = levels.filter((level) => save.levels[level.id]?.allOrbs).length
  const parMet = levels.filter((level) => save.levels[level.id]?.parMet).length
  const done = stats.mainDone + stats.challengeDone
  const count = levels.length
  const available = stats.mainCount > 0 && stats.mainDone === stats.mainCount
  const milestone =
    stats.earned === stats.ratingMax ? '全部关卡与评价已完成' : done === count ? '全部关卡已抵达' : '主线关卡已全部抵达'
  return { ...stats, available, milestone, done, count, allOrbs, parMet }
}

export type JourneyStats = ReturnType<typeof journeyStats>

export function canShareJourney(file: File): boolean {
  try {
    return typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] }) === true
  } catch {
    return false
  }
}

export async function shareJourney(file: File): Promise<'shared' | 'cancelled' | 'failed'> {
  try {
    await navigator.share({ files: [file], title: '积木错位 · 旅程成绩' })
    return 'shared'
  } catch (error) {
    return error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}
