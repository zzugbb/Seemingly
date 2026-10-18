export interface LevelTarget {
  minActions: number
  minActionsAll: number
  reachableStatesMin?: number
  randomWin?: { steps: number; maxRate: number }
  illusionsMin: number
  tradeoffsMin?: number
}

// 数值原样录入 T6.10 的六份关卡设计稿。
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
    minActions: 8,
    minActionsAll: 10,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
}
