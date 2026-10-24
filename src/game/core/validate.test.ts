import { describe, expect, it } from 'vitest'
import { defineLevel, type LevelBuilder } from '../levels/builders'
import type { LevelTarget } from '../levels/targets'
import type { OrbDef } from '../levels/types'
import { validateLevel, validateLevels } from './validate'

const fixture = (build: (b: LevelBuilder) => void = () => {}) =>
  defineLevel({
    id: 'validation-fixture',
    title: '校验测试',
    chapter: 1,
    build: (b) => {
      for (let x = 0; x <= 2; x++) b.path([x, 0, 0], 'sand')
      b.path([0, 0, 1], 'sand')
      b.orb({ tile: [0, 0, 1] })
      b.start([0, 0, 0])
      b.goal([2, 0, 0])
      build(b)
    },
    solution: [
      { type: 'walk', to: [0, 0, 1] },
      { type: 'walk', to: [2, 0, 0] },
    ],
  })

const withGear = () =>
  fixture((b) => {
    b.solid([5, 0, 0], 'teal')
    b.rotator({
      id: 'drive',
      pivot: [5, 0, 0],
      blocks: [{ offset: [1, 0, 0] }],
      handle: { block: [0, 0, 1], face: 'z' },
      links: [{ target: 'linked-lift' }],
    })
    b.mover({ id: 'linked-lift', origin: [8, 0, 0], axis: 'y', stops: [0, 1], blocks: [{ offset: [0, 0, 0] }] })
    b.plate({ id: 'pad', tile: [1, 0, 0], target: 'drive' })
  })

const riding = (obstacleY: number, manyGears = false) =>
  defineLevel({
    id: 'validation-riding',
    title: '乘坐安全测试',
    chapter: 1,
    build: (b) => {
      b.path([0, 0, 0], 'sand')
      b.path([0, 0, 1], 'sand')
      b.mover({
        id: 'lift',
        origin: [1, 0, 0],
        axis: 'y',
        stops: [0, 2],
        blocks: [{ offset: [0, 0, 0] }],
        handle: { block: [0, 0, 0], face: 'z' },
      })
      b.solid([1, obstacleY, 0], 'rose')
      if (manyGears)
        for (let index = 0; index < 3; index++) {
          b.solid([10 + index * 5, 0, 0], 'teal')
          b.rotator({
            id: `parked-${index}`,
            pivot: [10 + index * 5, 0, 0],
            blocks: [{ offset: [1, 0, 0], kind: 'solid' }],
          })
        }
      b.start([0, 0, 0])
      b.goal([0, 0, 1])
    },
    solution: [{ type: 'walk', to: [0, 0, 1] }],
  })

describe('新增引用检查', () => {
  it('合法联动、压板与静态及机关光点引用通过', () => {
    const level = withGear()
    level.orbs.push({ mechanism: 'drive', block: 0, optional: true })
    expect(validateLevel(level)).toEqual([])
  })

  it.each(['missing', 'pad', 'drive'])('拒绝联动到非法目标 %s', (target) => {
    const level = withGear()
    const drive = level.mechanisms.find((item) => item.type === 'rotator')!
    if (drive.type !== 'rotator') throw new Error('缺少转盘')
    drive.links = [{ target }]
    expect(validateLevel(level)).toContainEqual(
      expect.objectContaining({ check: '基本结构', cell: 'drive', detail: expect.stringContaining('联动') }),
    )
  })

  it.each<OrbDef>([
    { tile: [99, 0, 0] },
    { tile: [0, 0, 0] },
    { mechanism: 'missing', block: 0 },
    { mechanism: 'pad', block: 0 },
    { mechanism: 'drive', block: -1 },
    { mechanism: 'drive', block: 1 },
    { mechanism: 'drive', block: 0.5 },
  ])('非法光点引用返回具体光点编号，不抛异常：%j', (orb) => {
    const level = withGear()
    level.orbs.push(orb)
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '基本结构', cell: 'orb-1' }))
  })

  it('光点不能引用结构积木', () => {
    const level = withGear()
    const drive = level.mechanisms.find((item) => item.type === 'rotator')!
    if (drive.type !== 'rotator') throw new Error('缺少转盘')
    drive.blocks[0].kind = 'solid'
    level.orbs.push({ mechanism: 'drive', block: 0 })
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '基本结构', cell: 'orb-1' }))
  })

  it('压板必须位于静态路面，且目标存在', () => {
    const level = withGear()
    const plate = level.mechanisms.find((item) => item.type === 'plate')!
    if (plate.type !== 'plate') throw new Error('缺少压板')
    plate.tile = [99, 0, 0]
    plate.target = 'missing'
    const issues = validateLevel(level)
    expect(issues).toContainEqual(
      expect.objectContaining({ check: '基本结构', cell: '99,0,0', detail: expect.stringContaining('路面') }),
    )
    expect(issues).toContainEqual(
      expect.objectContaining({ check: '基本结构', cell: '99,0,0', detail: expect.stringContaining('目标') }),
    )
  })
})

describe('乘坐安全、完整可达布局与光点可见', () => {
  it('开局头顶有积木也会报错', () => {
    const level = fixture((b) => b.solid([0, 1, 0], 'rose'))
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '乘坐安全', cell: '0,0,0' }))
  })

  it('偏离标准解法乘升降台后头顶撞到积木也会报错', () => {
    expect(validateLevel(riding(3))).toContainEqual(expect.objectContaining({ check: '乘坐安全', cell: '1,2,0' }))
  })

  it('组合超过64时检查全部可达布局，而不只检查标准解法', () => {
    expect(validateLevel(riding(2, true))).toContainEqual(expect.objectContaining({ check: '无重叠', cell: '1,2,0' }))
  })

  it('超过64组合时不把不可达布局的重叠当成错误', () => {
    const level = riding(2, true)
    const lift = level.mechanisms.find((item) => item.type === 'mover')!
    if (lift.type !== 'mover') throw new Error('缺少平移台')
    delete lift.handle
    expect(validateLevel(level).filter((issue) => issue.check === '无重叠')).toEqual([])
  })

  it('开局静态光点被前方积木挡住时报告光点编号', () => {
    const level = fixture((b) => b.solid([1, 1, 2], 'rose'))
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '光点可见', cell: 'orb-0' }))
  })

  it('机关上的选做光点同样检查开局可见性', () => {
    const level = fixture((b) => {
      b.mover({ id: 'lift', origin: [5, 0, 0], axis: 'y', stops: [0, 2], blocks: [{ offset: [0, 0, 0] }] })
      b.solid([6, 1, 1], 'rose')
      b.orb({ mechanism: 'lift', block: 0, optional: true })
    })
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '光点可见', cell: 'orb-1' }))
  })
})

const target: LevelTarget = { minActions: 2, minActionsAll: 2, illusionsMin: 0 }

describe('登记难度目标与标准解法最优', () => {
  it('达标关卡通过，未登记的兼容关卡不检查最优步数', () => {
    const level = fixture()
    expect(validateLevel(level, new Set(), target)).toEqual([])
    level.solution = [
      { type: 'walk', to: [0, 0, 1] },
      { type: 'walk', to: [0, 0, 0] },
      { type: 'walk', to: [2, 0, 0] },
    ]
    expect(validateLevel(level)).toEqual([])
    expect(validateLevel(level, new Set(), target)).toContainEqual(
      expect.objectContaining({ check: '难度指标', detail: expect.stringContaining('标准解法') }),
    )
  })

  it('精确步数和所有可选门槛均受到检查', () => {
    const level = fixture()
    const issues = validateLevel(level, new Set(), {
      minActions: 3,
      minActionsAll: 3,
      illusionsMin: 1,
      tradeoffsMin: 1,
      reachableStatesMin: 99,
      randomWin: { steps: 30, maxRate: 0 },
    })
    const details = issues
      .filter((issue) => issue.check === '难度指标')
      .map((issue) => issue.detail)
      .join('\n')
    for (const metric of ['最少步数', '全收集', '可达状态', '随机通关率', '错觉连接', '取舍'])
      expect(details).toContain(metric)
  })

  it('随机通关率使用目标指定的步数预算', () => {
    expect(validateLevel(fixture(), new Set(), { ...target, randomWin: { steps: 0, maxRate: 0 } })).toEqual([])
  })

  it('validateLevels 对目标表中登记的关卡强制执行难度检查', () => {
    const level = fixture()
    expect(validateLevels([level], { [level.id]: { ...target, minActions: 3 } })).toContainEqual(
      expect.objectContaining({ check: '难度指标', cell: level.id }),
    )
  })
})

describe('T6.6 结构、安全与规模', () => {
  it('箱子引用机关路面通过，乘坐后头顶被挡也会定位箱子', () => {
    const level = fixture((b) => {
      b.mover({
        id: 'lift',
        origin: [5, 0, 0],
        axis: 'y',
        stops: [0, 2],
        blocks: [{ offset: [0, 0, 0] }],
        handle: { block: [0, 0, 1], face: 'z' },
      })
      b.crate({ mechanism: 'lift', block: 0 })
    })
    expect(validateLevel(level)).toEqual([])
    level.blocks.push({ pos: [5, 3, 0], color: 'rose', kind: 'solid' })
    expect(validateLevel(level)).toContainEqual(
      expect.objectContaining({ check: '乘坐安全', cell: '5,2,0', detail: expect.stringContaining('crate-0') }),
    )
  })

  it.each([
    { tile: [99, 0, 0] as [number, number, number] },
    { mechanism: 'missing', block: 0 },
    { mechanism: 'drive', block: -1 },
    { mechanism: 'drive', block: 1 },
    { mechanism: 'drive', block: 0.5 },
  ])('箱子引用必须有效：%j', (ref) => {
    const level = withGear()
    level.crates = [ref]
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '基本结构', cell: 'crate-0' }))
  })

  it.each(['起点', '终点', '门和箱子', '单向格和箱子', '箱子和箱子', '结构单向格'] as const)(
    '拒绝元素在禁止的位置或互相重叠：%s',
    (mode) => {
      const level = fixture()
      if (mode === '起点') level.mechanisms.push({ type: 'gate', id: 'gate', tile: level.start, mode: 'toggle' })
      if (mode === '终点') level.mechanisms.push({ type: 'gate', id: 'gate', tile: level.goal, mode: 'toggle' })
      if (mode === '门和箱子') {
        level.mechanisms.push({ type: 'gate', id: 'gate', tile: [1, 0, 0], mode: 'toggle' })
        level.crates = [{ tile: [1, 0, 0] }]
      }
      if (mode === '单向格和箱子') {
        level.blocks.find((b) => b.pos[0] === 1)!.oneWay = '+a'
        level.crates = [{ tile: [1, 0, 0] }]
      }
      if (mode === '箱子和箱子') level.crates = [{ tile: [1, 0, 0] }, { tile: [1, 0, 0] }]
      if (mode === '结构单向格') level.blocks.push({ pos: [8, 0, 0], kind: 'solid', color: 'sand', oneWay: '+a' })
      expect(validateLevel(level).some((issue) => issue.check === '基本结构')).toBe(true)
    },
  )

  it.each(['按住控制转盘', '触发控制按住门', '联动按住门', '按住门带把手', '按住门设初始开关'] as const)(
    '拒绝不匹配的门与压板配置：%s',
    (mode) => {
      const level = withGear()
      level.mechanisms.push({ type: 'gate', id: 'gate', tile: [1, 0, 0], mode: 'hold' })
      const pad = level.mechanisms.find((item) => item.type === 'plate')!
      const drive = level.mechanisms.find((item) => item.type === 'rotator')!
      const gate = level.mechanisms.find((item) => item.type === 'gate')!
      if (pad.type !== 'plate' || drive.type !== 'rotator' || gate.type !== 'gate') throw new Error('缺少机关')
      if (mode === '按住控制转盘') pad.mode = 'hold'
      if (mode === '触发控制按住门') pad.target = 'gate'
      if (mode === '联动按住门') drive.links = [{ target: 'gate' }]
      if (mode === '按住门带把手') gate.handle = { block: [0, 0, 1], face: 'z' }
      if (mode === '按住门设初始开关') gate.initiallyOpen = true
      expect(validateLevel(level).some((issue) => issue.check === '基本结构')).toBe(true)
    },
  )

  it.each([-1, 0.5, Infinity])('把手次数必须是非负整数：%s', (uses) => {
    const level = withGear()
    const drive = level.mechanisms.find((item) => item.type === 'rotator')!
    if (drive.type !== 'rotator') throw new Error('缺少转盘')
    drive.handle!.uses = uses
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '基本结构', cell: 'drive' }))
  })

  it.each(['箱子', '光点', '主线机关', '挑战机关'] as const)('限制元素数量：%s', (mode) => {
    const level = fixture()
    if (mode === '箱子') level.crates = Array.from({ length: 3 }, () => ({ tile: [1, 0, 0] }))
    if (mode === '光点') level.orbs = Array.from({ length: 5 }, () => ({ tile: [1, 0, 0] }))
    if (mode === '主线机关' || mode === '挑战机关') {
      level.challenge = mode === '挑战机关'
      level.mechanisms = Array.from({ length: level.challenge ? 6 : 5 }, (_, index) => ({
        type: 'mover',
        id: `lift-${index}`,
        origin: [5, 0, 0],
        axis: 'y',
        stops: [0, 1],
        blocks: [],
      }))
    }
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '规模上限', cell: level.id }))
  })
})

describe('巡逻路线与安全校验', () => {
  it.each(
    [
      [],
      [{ tile: [1, 0, 0] }],
      [{ tile: [1, 0, 0] }, { tile: [99, 0, 0] }],
      [{ tile: [0, 0, 1] }, { tile: [2, 0, 0] }],
    ].map((route) => ({ route })),
  )('拒绝无效路线 %#', ({ route }) => {
    const level = fixture()
    level.patrols = [{ mode: 'pingpong', route: structuredClone(route) as import('../levels/types').TileRef[] }]
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '巡逻路线' }))
  })
  it('限制巡逻者数量并拒绝开局重叠、非法环线闭合', () => {
    const level = fixture()
    const patrol = {
      route: [{ tile: [1, 0, 0] as [number, number, number] }, { tile: [2, 0, 0] as [number, number, number] }],
      mode: 'pingpong' as const,
    }
    level.patrols = [patrol, patrol]
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '规模上限' }))
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '基本结构' }))
    level.patrols = [
      { mode: 'loop', route: [{ tile: [0, 0, 1] }, { tile: [0, 0, 0] }, { tile: [1, 0, 0] }, { tile: [2, 0, 0] }] },
    ]
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '巡逻路线' }))
  })
  it('巡逻者随升降台到位时头顶不安全，即使随后走开也报错', () => {
    const level = defineLevel({
      id: 'unsafe-patrol',
      title: '安全测试',
      chapter: 5,
      solution: [],
      build: (b) => {
        b.path([0, 0, 0], 'sand')
        b.path([0, 0, 1], 'sand')
        b.path([1, 0, 2], 'sand')
        b.start([0, 0, 0])
        b.goal([0, 0, 1])
        b.solid([1, 3, 0], 'rose')
        b.mover({
          id: 'lift',
          origin: [1, 0, 0],
          axis: 'y',
          stops: [0, 2],
          blocks: [{ offset: [0, 0, 0] }],
          handle: { block: [0, 0, 0], face: 'z' },
        })
        b.patrol({ mode: 'pingpong', route: [{ mechanism: 'lift', block: 0 }, { tile: [1, 0, 1] }] })
        b.path([1, 0, 1], 'sand')
      },
    })
    expect(validateLevel(level)).toContainEqual(expect.objectContaining({ check: '乘坐安全' }))
  })
})
