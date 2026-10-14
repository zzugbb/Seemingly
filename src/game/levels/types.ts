export type Vec3 = [number, number, number]

export type BlockKind = 'path' | 'solid'

export interface BlockDef {
  pos: Vec3
  color: string
  kind: BlockKind
}

export interface RotatorDef {
  pivot: Vec3
  arms: Vec3[]
  color: string
  crank: Vec3
}

export interface IslandDef {
  x: [number, number]
  z: [number, number]
  y: number
  depth: number
}

export interface LevelDef {
  blocks: BlockDef[]
  islands: IslandDef[]
  rotator: RotatorDef
  start: Vec3
  goal: Vec3
  trees: Vec3[]
  flowers: Vec3[]
  windows: { pos: Vec3; face: 'x' | 'z' }[]
}
