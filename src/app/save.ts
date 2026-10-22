import { levelRevisions } from '../game/levels'
import { readTutorials, type TutorialId } from './tutorials'

export interface LevelRecord {
  done: boolean
  allOrbs: boolean
  bestSteps: number | null
  parMet: boolean
}

export interface SaveData {
  version: 2
  levels: Record<string, LevelRecord>
  muted: boolean
  tutorials?: TutorialId[]
}

const KEY = 'seemingly:save:v2'
const CAMPAIGN = 'remake'
export const emptySave = (): SaveData => ({ version: 2, levels: {}, muted: false })

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    const data: unknown = JSON.parse(raw ?? localStorage.getItem('seemingly:save:v1') ?? 'null')
    if (!object(data) || typeof data.muted !== 'boolean') return emptySave()
    if (!raw && data.version === 1) return { ...emptySave(), muted: data.muted }
    if (data.version !== 2 || !object(data.levels)) return emptySave()
    const levels: Record<string, LevelRecord> = {}
    for (const [id, record] of Object.entries(data.levels)) {
      if (
        !object(record) ||
        typeof record.done !== 'boolean' ||
        typeof record.allOrbs !== 'boolean' ||
        typeof record.parMet !== 'boolean' ||
        !(
          record.bestSteps === null ||
          (typeof record.bestSteps === 'number' && Number.isSafeInteger(record.bestSteps) && record.bestSteps >= 0)
        )
      )
        return emptySave()
      const revision = object(data.revisions) ? data.revisions[id] : undefined
      if ((revision ?? 1) !== (levelRevisions[id] ?? 1)) continue
      Object.defineProperty(levels, id, {
        value: { done: record.done, allOrbs: record.allOrbs, bestSteps: record.bestSteps, parMet: record.parMet },
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    const tutorials = data.campaign === CAMPAIGN ? readTutorials(data.tutorials) : []
    return {
      version: 2,
      levels: data.campaign === CAMPAIGN ? levels : {},
      muted: data.muted,
      ...(tutorials.length ? { tutorials } : {}),
    }
  } catch {
    return emptySave()
  }
}

export function writeSave(save: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, campaign: CAMPAIGN, revisions: levelRevisions }))
  } catch {
    // 隐私模式或存储空间不足时，当前会话仍可继续。
  }
}
