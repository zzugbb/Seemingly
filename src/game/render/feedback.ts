import type { Action } from '../core/rules'

export interface RenderHint {
  action: Action
  at: number
}

export interface RenderFeedback {
  blockedCrates: Map<string, number>
  blockedHandles: Map<string, number>
  goalLockedAt: number
  mechanisms: Map<string, { startedAt: number; settledAt: number | null }>
}

export const mechanismStrength = (feedback: RenderFeedback, id: string): number => {
  const motion = feedback.mechanisms.get(id)
  if (!motion) return 0
  return motion.settledAt === null ? 1 : Math.max(0, 1 - (performance.now() - motion.settledAt) / 900)
}

export const hintStrength = (hint: RenderHint | null | undefined, type: Action['type'], id: string): number => {
  if (!hint || hint.action.type !== type || performance.now() - hint.at >= 2000) return 0
  const target =
    hint.action.type === 'walk'
      ? hint.action.tileId
      : hint.action.type === 'push'
        ? hint.action.crate
        : hint.action.mechanism
  return target === id ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(((performance.now() - hint.at) / 800) * Math.PI * 2)) : 0
}
