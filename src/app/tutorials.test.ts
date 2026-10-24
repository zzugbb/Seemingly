import { describe, expect, it } from 'vitest'
import { mainLevels } from '../game/levels'
import { LevelSim } from '../game/core/sim'
import { emptySave } from './save'
import {
  createTutorialSession,
  learnedTutorials,
  nextTutorial,
  openingTutorialIds,
  readTutorials,
  tutorialsFromEvent,
  type TutorialId,
} from './tutorials'

describe('首次教学', () => {
  it('一次一句，按对应操作收起，第四和第六关不重复教学', () => {
    const save = emptySave()
    expect(nextTutorial('level-01', save)).toBe('点击浅色路面，小人会走过去')
    save.tutorials = ['walk']
    expect(nextTutorial('level-01', save)).toContain('路过光点')
    save.tutorials.push('collect')
    expect(nextTutorial('level-01', save)).toBeNull()
    expect(nextTutorial('level-02', save)).toContain('金色转轮')
    expect(nextTutorial('level-03', save)).toContain('随它一起移动')
    expect(nextTutorial('level-05', save)).toContain('金色拉杆')
    expect(nextTutorial('level-04', save)).toBeNull()
    expect(nextTutorial('level-06', save)).toBeNull()
  })

  it('只从有效已抵达正式关推断能力，不把样段或任意编号当作教学完成', () => {
    const save = emptySave()
    const done = { done: true, allOrbs: false, parMet: false, bestSteps: 12 }
    save.levels = { 'sample-01': done, unknown: done }
    expect(learnedTutorials(save)).toEqual([])
    save.levels['level-02'] = { ...done, done: false }
    expect(learnedTutorials(save)).toEqual([])
    save.levels['level-02'] = done
    expect(learnedTutorials(save)).toEqual(['walk', 'collect', 'rotate'])
    expect(nextTutorial('level-01', save)).toBeNull()
    expect(nextTutorial('level-03', save)).not.toBeNull()
    save.levels['level-06'] = done
    expect(learnedTutorials(save)).not.toContain('lift')
    save.levels['level-05'] = done
    expect(learnedTutorials(save)).toEqual([...openingTutorialIds])
    expect(learnedTutorials(save)).not.toContain('link')
    expect(learnedTutorials(save)).not.toContain('push')
  })

  it('旧前六关全通不会推断新机制，已学的新项刷新后仍在', () => {
    const save = emptySave()
    const done = { done: true, allOrbs: true, parMet: true, bestSteps: 8 }
    for (const level of mainLevels.slice(0, 6)) save.levels[level.id] = done
    expect(learnedTutorials(save)).toEqual([...openingTutorialIds])
    expect(nextTutorial('level-02', save)).toBeNull()
    expect(nextTutorial('level-05', save)).toBeNull()
    expect(nextTutorial('level-08', save)).toBe('两个转轮，都能带动远处的桥')
    expect(nextTutorial('level-09', save)).toBe('停在单框压板上，召来远处的平台')
    expect(nextTutorial('level-10', save)).toBe('站到箱子旁，点击箱子向前推一格')
    expect(nextTutorial('level-11', save)).toBe('顺着箭头进入路面')
    expect(nextTutorial('level-12', save)).toBe('亮点是剩余次数，撤销可恢复')
    save.tutorials = ['link', 'plate']
    expect(nextTutorial('level-08', save)).toBeNull()
    expect(nextTutorial('level-09', save)).toBeNull()
    expect(nextTutorial('level-10', save)).toContain('向前推')
    expect(learnedTutorials(save)).toEqual([...openingTutorialIds, 'link', 'plate'])
  })

  it('无操作、开始运动及撤销不标记学会；到位只为实际乘客记录乘坐', () => {
    const level = mainLevels[1]
    expect(tutorialsFromEvent(level, { type: 'walk-start', route: ['bridge#0'] }, '0,0,2')).toEqual([])
    expect(tutorialsFromEvent(level, { type: 'mechanism-start', id: 'bridge' }, 'bridge#0')).toEqual([])
    expect(tutorialsFromEvent(level, { type: 'undo' }, 'bridge#0')).toEqual([])
    expect(tutorialsFromEvent(level, { type: 'mechanism-end', id: 'bridge' }, '3,1,3')).toEqual(['rotate'])
    expect(tutorialsFromEvent(level, { type: 'mechanism-end', id: 'bridge' }, 'bridge#0')).toEqual(['rotate', 'ride'])
    expect(tutorialsFromEvent(level, { type: 'mechanism-end', id: 'unknown' }, 'unknown#0')).toEqual([])
  })

  it.each([1, 2, 4])('实际标准解事件能收起主线索引 %s 的全部教学，撤销不改已学能力', (index) => {
    const level = mainLevels[index]
    const sim = new LevelSim(level)
    const save = emptySave()
    for (const step of level.solution) {
      const command = step.type === 'walk' ? { type: 'walk' as const, tileId: sim.tileAt(step.to)!.id } : step
      expect(sim.command(command)).toBe('ok')
      for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) {
        for (const event of sim.update(1 / 30)) {
          save.tutorials = [
            ...new Set([...(save.tutorials ?? []), ...tutorialsFromEvent(level, event, sim.state().at)]),
          ]
        }
      }
      expect(sim.isIdle()).toBe(true)
    }
    expect(sim.status).toBe('won')
    expect(nextTutorial(level.id, save)).toBeNull()
    const known = learnedTutorials(save)
    expect(known).toContain(index === 1 ? 'rotate' : index === 2 ? 'ride' : 'lift')
    expect(sim.undo()).toBe(true)
    expect(learnedTutorials(save)).toEqual(known)
    expect(nextTutorial(level.id, save)).toBeNull()
  })

  it('读档只接受已知教学标识并去重', () => {
    expect(readTutorials(['lift', 'rotate', 'rotate', 'made-up', 1, null])).toEqual(['rotate', 'lift'])
    expect(readTutorials({ walk: true })).toEqual([])
    expect(readTutorials(['link', 'push', 'limited'])).toEqual(['link', 'push', 'limited'])
  })

  it('新教学等动作提交后才记下，推动开始、经过和拒绝都不算学会', () => {
    const learned = new Set<TutorialId>()
    const play = (index: number) => {
      const level = mainLevels[index]
      const sim = new LevelSim(level)
      const session = createTutorialSession()
      const known = () => [...learned]
      for (const step of level.solution) {
        const command = step.type === 'walk' ? { type: 'walk' as const, tileId: sim.tileAt(step.to)!.id } : step
        expect(sim.command(command)).toBe('ok')
        for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) {
          for (const event of sim.update(1 / 30)) {
            const skills = session.observe(level, event, sim.state())
            if (event.type === 'push') expect(skills).not.toContain('push')
            if (event.type === 'mechanism-start') expect(skills).not.toContain('link')
            if (event.type === 'plate') expect(skills).not.toContain('plate')
            for (const skill of skills) learned.add(skill)
          }
        }
        expect(sim.isIdle()).toBe(true)
        for (const skill of session.confirm(level, sim.state(), known())) learned.add(skill)
      }
      expect(sim.status).toBe('won')
    }
    play(7)
    expect(learned.has('link')).toBe(true)
    expect(learned.has('plate')).toBe(false)
    play(8)
    expect(learned.has('plate')).toBe(true)
    const beforeHold = learned.has('hold')
    play(9)
    expect(learned.has('push')).toBe(true)
    expect(beforeHold).toBe(false)
    expect(learned.has('hold')).toBe(true)
    play(10)
    expect(learned.has('oneway')).toBe(true)
    play(11)
    expect(learned.has('limited')).toBe(true)
    const kept = [...learned]
    const level = mainLevels[9]
    const sim = new LevelSim(level)
    const session = createTutorialSession()
    expect(sim.command({ type: 'push', crate: 'missing' })).not.toBe('ok')
    expect(session.observe(level, { type: 'undo' }, sim.state())).toEqual([])
    expect(session.confirm(level, sim.state(), kept)).not.toContain('push')
  })
})

it('巡逻首次教学等真实移动提交后收起，旧十二关和等待不会提前学会', () => {
  const save = emptySave()
  for (const level of mainLevels.slice(0, 12))
    save.levels[level.id] = { done: true, allOrbs: true, parMet: true, bestSteps: 8 }
  expect(learnedTutorials(save)).not.toContain('patrol')
  expect(nextTutorial('level-13', save)).toBe('小生物会在你完成一步后走一格')
  const level = mainLevels[12],
    sim = new LevelSim(level),
    session = createTutorialSession()
  expect(session.confirm(level, sim.state(), [])).not.toContain('patrol')
  const step = level.solution[0]
  expect(step.type).toBe('walk')
  if (step.type !== 'walk') throw Error('设计基准首步应为行走')
  expect(sim.command({ type: 'walk', tileId: sim.tileAt(step.to)!.id })).toBe('ok')
  let sawPatrol = false
  for (let i = 0; i < 800 && !sim.isIdle(); i++) {
    for (const event of sim.update(1 / 30)) {
      const skills = session.observe(level, event, sim.state())
      if (event.type === 'patrol-move') {
        sawPatrol = true
        expect(sim.isIdle()).toBe(false)
        expect(skills).not.toContain('patrol')
      }
    }
  }
  expect(sawPatrol).toBe(true)
  save.tutorials = session.confirm(level, sim.state(), learnedTutorials(save))
  expect(save.tutorials).toContain('patrol')
  expect(nextTutorial('level-13', save)).toBeNull()
  expect(sim.undo()).toBe(true)
  expect(nextTutorial('level-13', save)).toBeNull()
  expect(readTutorials(['patrol', 'patrol', 'unknown'])).toEqual(['patrol'])
})
