export interface LevelTarget {
  minActions: number
  minActionsAll: number
  reachableStatesMin?: number
  randomWin?: { steps: number; maxRate: number }
  illusionsMin: number
  tradeoffsMin?: number
}

// 首版九关不登记目标；重制关卡的数值由设计者随设计稿填写。
export const targets: Record<string, LevelTarget> = {}
