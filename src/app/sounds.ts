import { playSound } from '../audio/sfx'
import type { SimEvent } from '../game/core/sim'
import type { LevelDef } from '../game/levels/types'
import type { OrbProgress } from '../audio/theory'
import type { LevelRecord } from './save'
import type { Sound } from '../audio/sfx'

export function orbSound(level: LevelDef, id: string, progress?: OrbProgress): Sound {
  const orb = level.orbs.find((_, i) => `orb-${i}` === id)
  if (orb?.optional) return 'optionalOrb'
  return progress && progress.required > 0 && progress.requiredCollected >= progress.required ? 'ready' : 'orb'
}
export function newRatingCount(before: LevelRecord | undefined, after: LevelRecord): number {
  return (['done', 'allOrbs', 'parMet'] as const).filter((key) => after[key] && !before?.[key]).length
}
export function playNewRatings(before: LevelRecord | undefined, after: LevelRecord): void {
  const count = newRatingCount(before, after)
  if (count) playSound('rating', { count })
}
export function playSimEvent(event: SimEvent, level: LevelDef, progress?: OrbProgress): void {
  const register =
    'id' in event ? (level.mechanisms.findIndex((mechanism) => mechanism.id === event.id) % 2 === 1 ? 7 : 0) : 0
  if (event.type === 'step') playSound('step')
  if (event.type === 'mechanism-start' && level.soundtrack === 'courtyard') playSound('turn', { register })
  if (event.type === 'mechanism-tick') {
    if (level.soundtrack === 'courtyard') playSound('mechanism', { register })
    else playSound('mechanism')
  }
  if (event.type === 'orb') playSound(orbSound(level, event.id, progress))
  if (event.type === 'goal-locked') playSound('goalLocked')
  if (event.type === 'undo') playSound('undo')
  if (event.type === 'push') playSound('push')
  if (event.type === 'gate') playSound('gate', { open: event.open })
  if (event.type === 'won') {
    playSound('lantern')
    if (level.id === 'level-09' || level.id === 'level-12') playSound('seal', { chapter: level.chapter === 4 ? 4 : 3 })
  }
}
