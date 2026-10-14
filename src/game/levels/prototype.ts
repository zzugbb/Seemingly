import { palette } from '../render/palette'
import type { BlockDef, IslandDef, LevelDef } from './types'

function buildLevel(): LevelDef {
  const blocks: BlockDef[] = []
  const islands: IslandDef[] = []

  const solid = (x: number, y: number, z: number, color: string) =>
    blocks.push({ pos: [x, y, z], color, kind: 'solid' })
  const path = (x: number, y: number, z: number, color: string) =>
    blocks.push({ pos: [x, y, z], color, kind: 'path' })
  const column = (x: number, z: number, y0: number, y1: number, color: string) => {
    for (let y = y0; y <= y1; y++) solid(x, y, z, color)
  }
  const island = (x0: number, x1: number, z0: number, z1: number, y: number, depth: number) => {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) solid(x, y, z, palette.sand)
    }
    islands.push({ x: [x0, x1], z: [z0, z1], y, depth })
  }

  // 起点小岛：低处的步道
  island(-1, 2, -1, 4, -1, 3.2)
  path(0, 0, 3, palette.terracotta)
  path(0, 0, 2, palette.terracotta)
  path(0, 0, 1, palette.terracotta)
  path(0, 0, 0, palette.terracotta)
  path(1, 0, 0, palette.terracotta)
  path(2, 0, 0, palette.terracotta)

  // 高塔：塔顶在屏幕上紧贴起点步道的尽头
  island(6, 11, 3, 5, -1, 4)
  column(7, 4, 0, 3, palette.rose)
  column(8, 4, 0, 3, palette.rose)
  path(7, 4, 4, palette.rose)
  path(8, 4, 4, palette.rose)

  // 转盘立柱
  column(10, 4, 0, 3, palette.teal)
  path(10, 4, 4, palette.teal)

  // 终点基座：比桥低得多，但转盘转到位后看起来正好接上
  island(8, 11, 0, 1, -1, 2.6)
  solid(9, 0, 1, palette.terracotta)
  solid(10, 0, 1, palette.terracotta)
  path(9, 1, 1, palette.terracotta)
  path(10, 1, 1, palette.terracotta)

  return {
    blocks,
    islands,
    rotator: {
      pivot: [10, 4, 4],
      arms: [
        [0, 0, -1],
        [0, 0, 1],
      ],
      color: palette.tealLight,
      crank: [10, 2, 4],
    },
    start: [0, 0, 3],
    goal: [10, 1, 1],
    trees: [
      [-1, -1, 1],
      [2, -1, 3],
      [-1, -1, 4],
      [11, -1, 0],
      [6, -1, 5],
    ],
    flowers: [
      [1, -1, 2],
      [-1, -1, -1],
      [2, -1, 1.6],
      [1.4, -1, 4],
      [9, -1, 5],
      [11, -1, 3],
    ],
    windows: [
      { pos: [7, 1, 4], face: 'z' },
      { pos: [8, 2, 4], face: 'z' },
      { pos: [8, 1, 4], face: 'x' },
      { pos: [8, 3, 4], face: 'x' },
      { pos: [7, 3, 4], face: 'z' },
    ],
  }
}

export const level = buildLevel()
