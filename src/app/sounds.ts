import { playSound } from '../audio/sfx'
import type { SimEvent } from '../game/core/sim'

export function playSimEvent(event: SimEvent): void {
  if (event.type === 'step') playSound('step')
  if (event.type === 'mechanism-tick') playSound('mechanism')
  if (event.type === 'won') playSound('lantern')
}
