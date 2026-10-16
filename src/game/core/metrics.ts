import type { LevelDef } from '../levels/types'
import { analyze, randomWinRate, type LevelMetrics } from './solver'

export const RANDOM_RUNS = 500
export const RANDOM_SEED = 20261016
export const DEFAULT_RANDOM_STEPS = 30

export interface LevelReport extends LevelMetrics {
  randomSteps: number
  randomRate: number
}

export function measureLevel(level: LevelDef, randomSteps = DEFAULT_RANDOM_STEPS): LevelReport {
  return {
    ...analyze(level),
    randomSteps,
    randomRate: randomWinRate(level, { runs: RANDOM_RUNS, maxActions: randomSteps, seed: RANDOM_SEED }),
  }
}
