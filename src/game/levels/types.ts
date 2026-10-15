export type Vec3 = [number, number, number]
export type Axis = 'x' | 'y' | 'z'
export type Face = 'x' | 'z' // 只允许可见的 +x、+z 两个侧面

export type ColorName = 'sand' | 'terracotta' | 'rose' | 'teal' | 'tealLight' | 'plum' | 'cream'

export interface BlockDef {
  pos: Vec3
  color: ColorName
  kind: 'path' | 'solid'
}

export interface MechBlockDef {
  offset: Vec3 // 相对于转盘中心或平移台原点
  color?: ColorName // 默认 tealLight
  kind?: 'path' | 'solid' // 默认 path
}

export interface HandleDef {
  block: Vec3 // 把手所在的静态结构积木
  face: Face
}

export interface RotatorDef {
  type: 'rotator'
  id: string
  pivot: Vec3 // 必须是一块静态积木，本身不转
  blocks: MechBlockDef[]
  initialStep?: 0 | 1 | 2 | 3
  handle: HandleDef
}

export interface MoverDef {
  type: 'mover'
  id: string
  origin: Vec3
  axis: Axis
  stops: number[] // 沿 axis 的整数偏移，升序，如 [0, 2, 3]
  initialStop?: number // stops 的下标，默认 0
  blocks: MechBlockDef[]
  handle: HandleDef
}

export interface PlateDef {
  type: 'plate'
  id: string
  tile: Vec3 // 必须是一块静态路面
  target: string // 被触发的转盘或平移台的 id
  once?: boolean
}

export type MechanismDef = RotatorDef | MoverDef | PlateDef

export interface IslandDef {
  x: [number, number]
  z: [number, number]
  y: number
  depth: number
}

export interface DecorDef {
  islands: IslandDef[]
  trees: Vec3[]
  flowers: Vec3[]
  windows: { pos: Vec3; face: Face }[]
}

export type SolutionStep = { type: 'walk'; to: Vec3 } | { type: 'operate'; mechanism: string }

export interface EndingDef {
  lanterns: Vec3[] // 第一盏为终点，其余按点亮顺序排列
  tower: Vec3[]
}

export interface LevelDef {
  id: string // 'level-00' … 'level-08'
  title: string // 中文关名
  blocks: BlockDef[]
  mechanisms: MechanismDef[]
  start: Vec3
  goal: Vec3
  decor: DecorDef
  hints?: string[] // 底部操作提示，只在教学关使用
  solution: SolutionStep[]
  ending?: EndingDef
}
