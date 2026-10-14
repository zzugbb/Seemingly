export interface SaveData {
  version: 1
  completed: string[]
  muted: boolean
}

const KEY = 'seemingly:save:v1'

export const emptySave = (): SaveData => ({ version: 1, completed: [], muted: false })

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySave()
    const data = JSON.parse(raw) as Partial<SaveData>
    if (data.version !== 1 || !Array.isArray(data.completed) || typeof data.muted !== 'boolean') return emptySave()
    return {
      version: 1,
      completed: data.completed.filter((id): id is string => typeof id === 'string'),
      muted: data.muted,
    }
  } catch {
    return emptySave()
  }
}

export function writeSave(save: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(save))
}
