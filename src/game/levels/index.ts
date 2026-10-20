import level01 from './level-01'
import level02 from './level-02'
import level03 from './level-03'
import level04 from './level-04'
import level05 from './level-05'
import level06 from './level-06'
import sample01 from './sample-01'

import type { LevelDef } from './types'
export type { LevelDef } from './types'

export const mainLevels = [level01, level02, level03, level04, level05, level06]

export const challengeLevels: LevelDef[] = []
export const levels = mainLevels
export const sampleLevels = [sample01]
export const levelRevisions: Record<string, number> = Object.fromEntries(
  [...mainLevels, ...challengeLevels].map((level) => [level.id, level.revision ?? 1]),
)
