import { describe, expect, it } from 'vitest'
import { defineLevel, type LevelBuilder } from '../levels/builders'
import { mainLevels } from '../levels'
import sample from '../levels/sample-01'
import { checkMotionClearance } from './clearance'
import { advanceBrace, braceScale } from './shapes'

const fixture = (build: (b: LevelBuilder) => void) =>
  defineLevel({
    id: 'clearance-test',
    title: '净空测试',
    chapter: 2,
    solution: [],
    build: (b) => {
      b.path([8, 0, 8], 'sand')
      b.start([8, 0, 8])
      b.path([9, 0, 8], 'sand')
      b.goal([9, 0, 8])
      build(b)
    },
  })

const supportedByBasicSweep = (level: { crates?: unknown[]; mechanisms: { type: string; links?: unknown[] }[] }) =>
  !level.crates?.length &&
  level.mechanisms.every(
    (mechanism) => (mechanism.type === 'rotator' || mechanism.type === 'mover') && !mechanism.links?.length,
  )

describe('建筑运动净空', () => {
  it.each([...mainLevels, sample].filter(supportedByBasicSweep))(
    '$id：可达姿态全扫掠，结构、顶板、底座和角色不相交',
    (level) => {
      const report = checkMotionClearance(level)
      expect(report.issues).toEqual([])
      if (level.mechanisms.length) expect(report.characterTransitions).toBeGreaterThan(0)
    },
    180_000,
  )

  it('联动、压板、门和箱子不交给只覆盖独立机关的检查器', () => {
    const extended = mainLevels.filter((level) => !supportedByBasicSweep(level))
    expect(extended.map((level) => level.id)).toEqual([
      'level-08',
      'level-09',
      'level-10',
      'level-11',
      'level-12',
      'level-13',
      'level-14',
      'level-15',
    ])
    for (const level of extended) expect(() => checkMotionClearance(level)).toThrow(/另行建模/)
  })

  it('能抓到端点都不重叠的转盘中间碰撞', () => {
    const level = fixture((b) => {
      b.rotator({
        id: 'arm',
        pivot: [0, 0, 0],
        blocks: [{ offset: [2, 0, 0] }],
        handle: { block: [8, 0, 8], face: 'z' },
      })
      b.solid([1, 0, -2], 'rose')
    })
    expect(checkMotionClearance(level).issues).toContainEqual(
      expect.objectContaining({
        mechanism: 'arm',
        from: 0,
        object: 'arm#0',
        obstacle: '1,0,-2',
        fraction: expect.any(Number),
      }),
    )
  })

  it('升降途中穿过固定平台也会失败', () => {
    const level = fixture((b) => {
      b.mover({
        id: 'lift',
        origin: [3, 0, 0],
        axis: 'y',
        stops: [0, 4],
        blocks: [{ offset: [0, 0, 0] }],
        handle: { block: [8, 0, 8], face: 'z' },
      })
      b.solid([3, 2, 0], 'rose')
    })
    expect(checkMotionClearance(level).issues.some((issue) => issue.obstacle === '3,2,0')).toBe(true)
  })

  it('站立角色的身体也参与扫掠，不豁免人物', () => {
    const level = fixture((b) => {
      b.path([1, 0, -2], 'sand')
      b.start([1, 0, -2])
      b.rotator({
        id: 'arm',
        pivot: [0, 1, 0],
        blocks: [{ offset: [2, 0, 0], kind: 'solid' }],
        handle: { block: [8, 0, 8], face: 'z' },
      })
    })
    const issues = checkMotionClearance(level).issues
    expect(issues.some((issue) => issue.object === 'character@1,0,-2')).toBe(true)
  })

  it('岩层底座也参与扫掠，不能只检查规则层方块', () => {
    const level = fixture((b) => {
      b.island({ x: [0, 4], z: [-3, 1], y: 2, depth: 2 })
      b.rotator({
        id: 'arm',
        pivot: [0, 1, 0],
        blocks: [{ offset: [2, 0, 0] }],
        handle: { block: [8, 0, 8], face: 'z' },
      })
    })
    expect(checkMotionClearance(level).issues.some((issue) => issue.obstacle.startsWith('island-'))).toBe(true)
  })

  it('第四关回退真实纵深修复会重新抓到北台穿插', () => {
    const level = structuredClone(mainLevels[3])
    const ferry = level.mechanisms[0]
    if (ferry.type !== 'rotator') throw new Error('缺转盘')
    ferry.pivot = [6, 2, 4]
    const issues = checkMotionClearance(level).issues
    expect(issues.some((issue) => issue.obstacle === '5,1,1' || issue.obstacle === '4,1,4')).toBe(true)
  })

  it('不把尚未覆盖的联动当作检查通过', () => {
    const level = structuredClone(mainLevels[5])
    const west = level.mechanisms[0]
    if (west.type !== 'rotator') throw new Error('缺转盘')
    west.links = [{ target: 'east' }]
    expect(() => checkMotionClearance(level)).toThrow('须另行建模')
  })

  it('轴承例外不豁免碰到轴心的其他机关', () => {
    const level = fixture((b) => {
      b.rotator({
        id: 'arm',
        pivot: [0, 0, 0],
        blocks: [{ offset: [1, 0, 0] }],
        handle: { block: [8, 0, 8], face: 'z' },
      })
      b.rotator({ id: 'other', pivot: [5, 0, 0], blocks: [{ offset: [-5, 0, 0] }] })
    })
    expect(
      checkMotionClearance(level).issues.some((issue) => issue.object === 'arm#0' && issue.obstacle === 'other#0'),
    ).toBe(true)
  })

  it('收身需要时间、到位后恢复，不以瞬间缩小掩盖起步碰撞', () => {
    expect(braceScale(advanceBrace(0, true, 0))).toBe(1)
    expect(braceScale(advanceBrace(0, true, 0.06))).toBeCloseTo(0.97)
    expect(braceScale(advanceBrace(0, true, 0.12))).toBeCloseTo(0.94)
    expect(braceScale(advanceBrace(1, false, 0.12))).toBe(1)
  })
})
