import { describe, expect, it } from 'vitest'
import { mainLevels } from '../game/levels'
import { LevelSim } from '../game/core/sim'
import { emptySave } from './save'
import { learnedTutorials, nextTutorial, readTutorials, tutorialIds, tutorialsFromEvent } from './tutorials'

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
    expect(learnedTutorials(save)).toEqual(tutorialIds)
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
  })
})
