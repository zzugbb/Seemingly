import type { SimEvent } from '../game/core/sim'
import type { LevelDef } from '../game/levels/types'
import type { SaveData } from './save'

export const tutorialIds = ['walk', 'collect', 'rotate', 'ride', 'lift'] as const
export type TutorialId = (typeof tutorialIds)[number]

const lessons: Readonly<Record<string, readonly { skill: TutorialId; text: string }[]>> = {
  'level-01': [
    { skill: 'walk', text: '点击浅色路面，小人会走过去' },
    { skill: 'collect', text: '路过光点即可收集，集齐必需光点后点灯' },
  ],
  'level-02': [{ skill: 'rotate', text: '点击金色转轮，观察路面怎样连接' }],
  'level-03': [{ skill: 'ride', text: '站在移动的积木上，小人会随它一起移动' }],
  'level-05': [{ skill: 'lift', text: '拉动金色拉杆，观察平台怎样移动' }],
}

const provenSkills: Readonly<Record<string, readonly TutorialId[]>> = {
  'level-01': ['walk', 'collect'],
  'level-02': ['walk', 'collect', 'rotate'],
  'level-03': ['walk', 'collect', 'rotate', 'ride'],
  'level-04': ['walk', 'collect', 'rotate', 'ride'],
  'level-05': tutorialIds,
  'level-06': ['walk', 'collect', 'rotate', 'ride'],
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
