import { cellId } from '../game/core/iso'
import { gatesOf, type GameState } from '../game/core/rules'
import type { SimEvent } from '../game/core/sim'
import type { LevelDef } from '../game/levels/types'
import type { SaveData } from './save'

export const openingTutorialIds = ['walk', 'collect', 'rotate', 'ride', 'lift'] as const
export const tutorialIds = [
  ...openingTutorialIds,
  'link',
  'plate',
  'push',
  'hold',
  'oneway',
  'limited',
  'patrol',
] as const
export type TutorialId = (typeof tutorialIds)[number]

const lessons: Readonly<Record<string, readonly { skill: TutorialId; text: string }[]>> = {
  'level-01': [
    { skill: 'walk', text: '点击浅色路面，小人会走过去' },
    { skill: 'collect', text: '路过光点即可收集，集齐必需光点后点灯' },
  ],
  'level-02': [{ skill: 'rotate', text: '点击金色转轮，观察路面怎样连接' }],
  'level-03': [{ skill: 'ride', text: '站在移动的积木上，小人会随它一起移动' }],
  'level-05': [{ skill: 'lift', text: '拉动金色拉杆，观察平台怎样移动' }],
  'level-08': [{ skill: 'link', text: '两个转轮，都能带动远处的桥' }],
  'level-09': [{ skill: 'plate', text: '停在单框压板上，召来远处的平台' }],
  'level-10': [
    { skill: 'push', text: '站到箱子旁，点击箱子向前推一格' },
    { skill: 'hold', text: '箱子留在双框压板上，门会保持打开' },
  ],
  'level-11': [{ skill: 'oneway', text: '顺着箭头进入路面' }],
  'level-12': [{ skill: 'limited', text: '亮点是剩余次数，撤销可恢复' }],
  'level-13': [{ skill: 'patrol', text: '小生物会在你完成一步后走一格' }],
}

const provenSkills: Readonly<Record<string, readonly TutorialId[]>> = {
  'level-01': ['walk', 'collect'],
  'level-02': ['walk', 'collect', 'rotate'],
  'level-03': ['walk', 'collect', 'rotate', 'ride'],
  'level-04': ['walk', 'collect', 'rotate', 'ride'],
  // 第五关通关只证明当时已教的五项，不能跟随后来追加的 tutorialIds 一起扩张。
  'level-05': ['walk', 'collect', 'rotate', 'ride', 'lift'],
  'level-06': ['walk', 'collect', 'rotate', 'ride'],
  'level-08': ['walk', 'collect', 'rotate', 'ride', 'link'],
  'level-09': ['walk', 'collect', 'rotate', 'ride', 'plate'],
  'level-10': ['walk', 'collect', 'rotate', 'ride', 'lift', 'push', 'hold'],
  'level-11': ['walk', 'collect', 'rotate', 'ride', 'push', 'hold', 'oneway'],
  'level-12': ['walk', 'collect', 'ride', 'lift', 'push', 'hold', 'limited'],
  'level-13': ['walk', 'collect', 'ride', 'lift', 'patrol'],
}

export function readTutorials(value: unknown): TutorialId[] {
  if (!Array.isArray(value)) return []
  return tutorialIds.filter((id) => value.includes(id))
}

export function learnedTutorials(save: SaveData): TutorialId[] {
  const known = new Set<TutorialId>(save.tutorials)
  for (const [id, skills] of Object.entries(provenSkills)) {
    if (save.levels[id]?.done) for (const skill of skills) known.add(skill)
  }
  return tutorialIds.filter((id) => known.has(id))
}

export function nextTutorial(id: string, save: SaveData): string | null {
  const known = learnedTutorials(save)
  return lessons[id]?.find((lesson) => !known.includes(lesson.skill))?.text ?? null
}

export function tutorialsFromEvent(level: LevelDef, event: SimEvent, at: string): TutorialId[] {
  if (event.type === 'step') return ['walk']
  if (event.type === 'orb') return ['collect']
  if (event.type !== 'mechanism-end') return []
  const mechanism = level.mechanisms.find((item) => item.id === event.id)
  if (mechanism?.type !== 'rotator' && mechanism?.type !== 'mover') return []
  const skills: TutorialId[] = [mechanism.type === 'rotator' ? 'rotate' : 'lift']
  if (at.startsWith(`${event.id}#`)) skills.push('ride')
  return skills
}

const crateHoldsGate = (level: LevelDef, state: GameState) => {
  const crates = new Set(Object.values(state.crates))
  const gates = gatesOf(level, state)
  return level.mechanisms.some((plate) => {
    if (plate.type !== 'plate' || plate.mode !== 'hold' || !crates.has(cellId(plate.tile))) return false
    const gate = level.mechanisms.find((item) => item.id === plate.target)
    return gate?.type === 'gate' && gate.mode === 'hold' && gates[gate.id] === true
  })
}

export function createTutorialSession() {
  let starts: string[] = []
  let ends: string[] = []
  let plateTarget: string | null = null
  let plateSettled = false
  let pendingPush: { crate: string; from: string } | null = null
  let limitedSettled = false
  let patrolMoved = false
  const resetPending = () => {
    starts = []
    ends = []
    plateTarget = null
    plateSettled = false
    pendingPush = null
    limitedSettled = false
    patrolMoved = false
  }
  return {
    observe(level: LevelDef, event: SimEvent, state: GameState): TutorialId[] {
      if (event.type === 'undo') {
        resetPending()
        return []
      }
      if (event.type === 'patrol-move') {
        patrolMoved = true
        return []
      }
      if (event.type === 'push') {
        pendingPush = { crate: event.crate, from: state.crates[event.crate] ?? '' }
        return []
      }
      if (event.type === 'plate' && event.triggered) {
        const plate = level.mechanisms.find((item) => item.id === event.id)
        plateTarget = plate?.type === 'plate' ? plate.target : null
        plateSettled = false
        return []
      }
      if (event.type === 'mechanism-start') {
        starts.push(event.id)
        return []
      }
      if (event.type === 'mechanism-end') {
        ends.push(event.id)
        if (event.id === plateTarget) plateSettled = true
        const mechanism = level.mechanisms.find((item) => item.id === event.id)
        if (mechanism && 'handle' in mechanism && mechanism.handle?.uses !== undefined) limitedSettled = true
        return tutorialsFromEvent(level, event, state.at)
      }
      const skills = tutorialsFromEvent(level, event, state.at)
      if (event.type === 'step' && level.blocks.some((block) => block.oneWay && cellId(block.pos) === event.tileId))
        skills.push('oneway')
      return skills
    },
    confirm(level: LevelDef, state: GameState, known: readonly TutorialId[]): TutorialId[] {
      const skills: TutorialId[] = []
      if (new Set(starts).size >= 2 && new Set(ends).size >= 2) skills.push('link')
      if (plateTarget && plateSettled) skills.push('plate')
      if (pendingPush && state.crates[pendingPush.crate] !== pendingPush.from) skills.push('push')
      if (known.includes('push') && crateHoldsGate(level, state)) skills.push('hold')
      if (limitedSettled) skills.push('limited')
      if (patrolMoved) skills.push('patrol')
      resetPending()
      return skills
    },
  }
}
