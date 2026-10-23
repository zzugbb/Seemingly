export interface LevelTarget {
  minActions: number
  minActionsAll: number
  reachableStatesMin?: number
  randomWin?: { steps: number; maxRate: number }
  illusionsMin: number
  tradeoffsMin?: number
}

// 数值来自对应关卡设计稿与 T6.12 试玩校准稿。
export const targets: Record<string, LevelTarget> = {
  'level-01': { minActions: 3, minActionsAll: 3, illusionsMin: 1 },
  'level-02': { minActions: 3, minActionsAll: 3, illusionsMin: 2, tradeoffsMin: 1 },
  'level-03': { minActions: 4, minActionsAll: 4, illusionsMin: 2 },
  'level-04': {
    minActions: 8,
    minActionsAll: 12,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
  'level-05': {
    minActions: 11,
    minActionsAll: 12,
    reachableStatesMin: 40,
    randomWin: { steps: 30, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-06': {
    minActions: 12,
    minActionsAll: 14,
    reachableStatesMin: 40,
    randomWin: { steps: 30, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 2,
  },
  'level-07': {
    minActions: 8,
    minActionsAll: 10,
    reachableStatesMin: 40,
    randomWin: { steps: 40, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-08': {
    minActions: 13,
    minActionsAll: 14,
    reachableStatesMin: 40,
    randomWin: { steps: 40, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-09': {
    minActions: 13,
    minActionsAll: 14,
    reachableStatesMin: 40,
    randomWin: { steps: 40, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-10': {
    minActions: 12,
    minActionsAll: 13,
    reachableStatesMin: 60,
    randomWin: { steps: 50, maxRate: 0.25 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-11': {
    minActions: 11,
    minActionsAll: 12,
    reachableStatesMin: 60,
    randomWin: { steps: 50, maxRate: 0.25 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
  'level-12': {
    minActions: 10,
    minActionsAll: 11,
    reachableStatesMin: 60,
    randomWin: { steps: 50, maxRate: 0.25 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
}

export const sampleTargets: Record<string, LevelTarget> = {
  'sample-01': {
    minActions: 11,
    minActionsAll: 12,
    reachableStatesMin: 40,
    randomWin: { steps: 30, maxRate: 0.35 },
    illusionsMin: 2,
    tradeoffsMin: 1,
  },
}
