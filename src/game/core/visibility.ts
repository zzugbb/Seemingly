import type { Vec3 } from '../levels/types'

const BLOCK_HALF = 0.5
const SAMPLE_OFFSET = 0.35
const RAY: Vec3 = [1, 1, 1]
// 采样点贴在自身顶面上，t = 0 的接触不算被挡住。
const MIN_DISTANCE = 1e-8

export function topSamples([x, y, z]: Vec3): Vec3[] {
  const top = y + BLOCK_HALF
  return [
    [x, top, z],
    [x + SAMPLE_OFFSET, top, z],
    [x - SAMPLE_OFFSET, top, z],
    [x, top, z + SAMPLE_OFFSET],
    [x, top, z - SAMPLE_OFFSET],
  ]
}

export function rayHitsBlock(origin: Vec3, block: Vec3): boolean {
  let tNear = MIN_DISTANCE
  let tFar = Infinity
  for (let axis = 0; axis < 3; axis++) {
    const direction = RAY[axis]
    const min = block[axis] - BLOCK_HALF
    const max = block[axis] + BLOCK_HALF
    const t1 = (min - origin[axis]) / direction
    const t2 = (max - origin[axis]) / direction
    tNear = Math.max(tNear, Math.min(t1, t2))
    tFar = Math.min(tFar, Math.max(t1, t2))
    if (tNear > tFar) return false
  }
  return true
}

export function rayHitsAny(origin: Vec3, blocks: readonly Vec3[]): boolean {
  return blocks.some((block) => rayHitsBlock(origin, block))
}

export function topVisible(pos: Vec3, blocks: readonly Vec3[]): boolean {
  return topSamples(pos).every((sample) => !rayHitsAny(sample, blocks))
}
