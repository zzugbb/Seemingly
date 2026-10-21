import { mainLevels } from '../game/levels'
import type { LevelDef } from '../game/levels/types'
import type { SaveData } from './save'
import { firstPlayableIndex } from './store'

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

const ratingCount = (record: SaveData['levels'][string] | undefined) =>
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
