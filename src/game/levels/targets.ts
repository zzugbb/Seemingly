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
  'level-02': { minActions: 3, minActionsAll: 3, illusionsMin: 3 },
  'level-03': { minActions: 4, minActionsAll: 4, illusionsMin: 5 },
  'level-04': {
    minActions: 6,
    minActionsAll: 12,
    reachableStatesMin: 16,
    randomWin: { steps: 30, maxRate: 0.6 },
    illusionsMin: 1,
    tradeoffsMin: 1,
  },
  'level-05': {
    minActions: 8,
    minActionsAll: 12,
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
