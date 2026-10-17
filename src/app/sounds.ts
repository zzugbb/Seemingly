import { playSound } from '../audio/sfx'
import type { SimEvent } from '../game/core/sim'

export function playSimEvent(event: SimEvent): void {
  if (event.type === 'step') playSound('step')
  if (event.type === 'mechanism-tick') playSound('mechanism')
  if (event.type === 'orb') playSound('orb')
  if (event.type === 'goal-locked') playSound('goalLocked')
  if (event.type === 'undo') playSound('undo')
  if (event.type === 'push') playSound('push')
  if (event.type === 'gate') playSound('gate', { open: event.open })
  if (event.type === 'won') playSound('lantern')
}
