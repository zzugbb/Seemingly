export interface LevelTarget {
  minActions: number
  minActionsAll: number
  reachableStatesMin?: number
  randomWin?: { steps: number; maxRate: number }
  illusionsMin: number
  tradeoffsMin?: number
}

// 数值来自设计稿；第六关采用 T6.12b 试玩校准稿。
export const targets: Record<string, LevelTarget> = {
  'level-01': { minActions: 2, minActionsAll: 2, illusionsMin: 0 },
  'level-02': { minActions: 2, minActionsAll: 2, illusionsMin: 1 },
  'level-03': { minActions: 3, minActionsAll: 3, illusionsMin: 1 },
  'level-04': {
    minActions: 6,
    minActionsAll: 7,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
  'level-05': {
    minActions: 6,
    minActionsAll: 8,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
  'level-06': {
    minActions: 12,
    minActionsAll: 15,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
}
