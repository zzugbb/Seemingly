import type {
  BlockDef,
  ColorName,
  CrateDef,
  DecorDef,
  EndingDef,
  Face,
  GateDef,
  LevelDef,
  MechanismDef,
  MoverDef,
  OrbDef,
  PlateDef,
  RotatorDef,
  SolutionStep,
  Vec3,
} from './types'

const DEFAULT_ISLAND_DEPTH = 3

export interface LevelBuilder {
  island(spec: { x: [number, number]; z: [number, number]; y: number; depth?: number }): void
  path(pos: Vec3, color: ColorName, options?: { oneWay?: BlockDef['oneWay'] }): void
  solid(pos: Vec3, color: ColorName): void
  column(spec: { x: number; z: number; from: number; to: number }, color: ColorName): void
  rotator(spec: Omit<RotatorDef, 'type'>): void
  mover(spec: Omit<MoverDef, 'type'>): void
  plate(spec: Omit<PlateDef, 'type'>): void
  gate(spec: Omit<GateDef, 'type'>): void
  crate(def: CrateDef): void
  orb(def: OrbDef): void
  start(pos: Vec3): void
  goal(pos: Vec3): void
  tree(pos: Vec3): void
  flower(pos: Vec3): void
  window(spec: { pos: Vec3; face: Face }): void
}

export function defineLevel(spec: {
  id: string
  title: string
  chapter: LevelDef['chapter']
  challenge?: boolean
  hints?: string[]
  solution: SolutionStep[]
  ending?: EndingDef
  build: (b: LevelBuilder) => void
}): LevelDef {
  const blocks: BlockDef[] = []
  const mechanisms: MechanismDef[] = []
  const orbs: OrbDef[] = []
  const crates: CrateDef[] = []
  const decor: DecorDef = { islands: [], trees: [], flowers: [], windows: [] }
  let start: Vec3 | undefined
  let goal: Vec3 | undefined

  const solid = (pos: Vec3, color: ColorName) => {
    blocks.push({ pos, color, kind: 'solid' })
  }

  const builder: LevelBuilder = {
    island({ x, z, y, depth = DEFAULT_ISLAND_DEPTH }) {
      for (let ix = x[0]; ix <= x[1]; ix++) {
        for (let iz = z[0]; iz <= z[1]; iz++) solid([ix, y, iz], 'sand')
      }
      decor.islands.push({ x, z, y, depth })
    },
    path(pos, color, options = {}) {
      blocks.push({ pos, color, kind: 'path', ...options })
    },
    solid,
    column({ x, z, from, to }, color) {
      for (let y = from; y <= to; y++) solid([x, y, z], color)
    },
    rotator(def) {
      mechanisms.push({ type: 'rotator', ...def })
    },
    mover(def) {
      mechanisms.push({ type: 'mover', ...def })
    },
    plate(def) {
      mechanisms.push({ type: 'plate', ...def })
    },
    gate(def) {
      mechanisms.push({ type: 'gate', ...def })
    },
    crate(def) {
      crates.push(def)
    },
    orb(def) {
      orbs.push(def)
    },
    start(pos) {
      start = pos
    },
    goal(pos) {
      goal = pos
    },
    tree(pos) {
      decor.trees.push(pos)
    },
    flower(pos) {
      decor.flowers.push(pos)
    },
    window(entry) {
      decor.windows.push(entry)
    },
  }

  spec.build(builder)
  if (!start || !goal) throw new Error(`关卡 ${spec.id} 缺少起点或终点`)

  return {
    id: spec.id,
    title: spec.title,
    chapter: spec.chapter,
    challenge: spec.challenge,
    blocks,
    mechanisms,
    orbs,
    crates,
    start,
    goal,
    decor,
    hints: spec.hints,
    solution: spec.solution,
    ending: spec.ending,
  }
}
