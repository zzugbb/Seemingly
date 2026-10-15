const LANTERN_INTERVAL = 0.45
const TOWER_DELAY = 0.6
const MESSAGE_DELAY = 0.9

export function endingProgress(elapsed: number, count: number) {
  const towerAt = (count - 1) * LANTERN_INTERVAL + TOWER_DELAY
  return {
    litCount: Math.min(count, 1 + Math.floor(Math.max(0, elapsed) / LANTERN_INTERVAL)),
    towerLit: elapsed + 1e-8 >= towerAt,
    finished: elapsed + 1e-8 >= towerAt + MESSAGE_DELAY,
  }
}
