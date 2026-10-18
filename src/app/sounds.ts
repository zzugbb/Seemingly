import { playSound } from '../audio/sfx'
import type { SimEvent } from '../game/core/sim'
import type { LevelDef } from '../game/levels/types'

export function playSimEvent(event: SimEvent, level: LevelDef): void {
  const register =
    'id' in event ? (level.mechanisms.findIndex((mechanism) => mechanism.id === event.id) % 2 === 1 ? 7 : 0) : 0
  if (event.type === 'step') playSound('step')
  if (event.type === 'mechanism-start' && level.soundtrack === 'courtyard') playSound('turn', { register })
  if (event.type === 'mechanism-tick') {
    if (level.soundtrack === 'courtyard') playSound('mechanism', { register })
    else playSound('mechanism')
  }
  if (event.type === 'orb') playSound('orb')
  if (event.type === 'goal-locked') playSound('goalLocked')
  if (event.type === 'undo') playSound('undo')
  if (event.type === 'push') playSound('push')
  if (event.type === 'gate') playSound('gate', { open: event.open })
  if (event.type === 'won') playSound('lantern')
}
