import type { IslandDef, Vec3 } from '../levels/types'

export const BLOCK_SIZE = 0.98
export const BLOCK_RADIUS = 0.07
export const SLAB_WIDTH = 0.84
export const SLAB_RADIUS = 0.03

export const BRACE_TIME = 0.12
export const BRACED_SCALE = 0.94
export const CHARACTER_RADIUS = 0.26
// 包含倾斜帽尖及最大呼吸幅度，不含行走摆动（机关运动期间不行走）。
export const CHARACTER_HEIGHT = 1

export function advanceBrace(value: number, moving: boolean, dt: number): number {
  return Math.max(0, Math.min(1, value + ((moving ? 1 : -1) * Math.max(0, dt)) / BRACE_TIME))
}

export const braceScale = (value: number) => 1 - (1 - BRACED_SCALE) * value

export interface RockLayer {
  position: Vec3
  size: Vec3
}

export function islandLayers(island: IslandDef): RockLayer[] {
  const count = Math.max(2, Math.round(island.depth / 0.62))
  const width = island.x[1] - island.x[0] + 1
  const depth = island.z[1] - island.z[0] + 1
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 0.6)
    const sway = ((i * 37) % 5) / 10 - 0.2
    return {
      position: [
        (island.x[0] + island.x[1]) / 2 + sway * (1 - t),
        island.y - 0.5 - 0.62 * (i + 0.5) + 0.02,
        (island.z[0] + island.z[1]) / 2 - sway * 0.6 * (1 - t),
      ],
      size: [Math.max(0.5, width * (1 - t) + 0.1), 0.62, Math.max(0.5, depth * (1 - t) + 0.1)],
    }
  })
}
