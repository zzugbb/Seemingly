export const MASTER_GAIN = 0.28
export const MUSIC_GAIN = 0.18
export const FEEDBACK_GAIN = 0.75
export const REVERB_SEND = 0.35
export const FOCUS_ATTACK = 0.035

export interface FeedbackFocus {
  gain: number
  hold: number
  release: number
}

const focusProfiles = {
  step: null,
  turn: { gain: 0.72, hold: 1, release: 0.45 },
  mechanism: { gain: 0.65, hold: 0.7, release: 0.45 },
  orb: { gain: 0.36, hold: 0.95, release: 0.5 },
  optionalOrb: { gain: 0.32, hold: 1.45, release: 0.65 },
  ready: { gain: 0.3, hold: 1.4, release: 0.65 },
  lantern: { gain: 0.22, hold: 2.5, release: 0.8 },
  rating: { gain: 0.3, hold: 2, release: 0.65 },
  unreachable: { gain: 0.55, hold: 0.55, release: 0.35 },
  undo: { gain: 0.6, hold: 0.3, release: 0.35 },
  goalLocked: { gain: 0.55, hold: 0.55, release: 0.35 },
  push: { gain: 0.6, hold: 0.35, release: 0.4 },
  gate: { gain: 0.62, hold: 0.45, release: 0.4 },
  patrol: null,
  seal: { gain: 0.22, hold: 5.4, release: 0.8 },
} satisfies Record<string, FeedbackFocus | null>

export type Sound = keyof typeof focusProfiles
export const feedbackFocus = (sound: Sound): FeedbackFocus | null => focusProfiles[sound]

export interface MusicFocus {
  at: number
  from: number
  target: number
  holdUntil: number
  releaseUntil: number
}

export function focusValue(focus: MusicFocus | undefined, at: number): number {
  if (!focus) return 1
  const attackEnd = focus.at + FOCUS_ATTACK
  if (at <= focus.at) return focus.from
  if (at < attackEnd) return focus.from + ((focus.target - focus.from) * (at - focus.at)) / FOCUS_ATTACK
  if (at <= focus.holdUntil) return focus.target
  if (at >= focus.releaseUntil) return 1
  return focus.target + ((1 - focus.target) * (at - focus.holdUntil)) / (focus.releaseUntil - focus.holdUntil)
}

export function nextFocus(
  previous: MusicFocus | undefined,
  profile: FeedbackFocus,
  at: number,
  current = 1,
): MusicFocus {
  const from = previous ? focusValue(previous, at) : current
  const held = previous && at < previous.holdUntil ? previous.target : 1
  const holdUntil = Math.max(at + profile.hold, previous?.holdUntil ?? at)
  return {
    at,
    from,
    target: Math.min(from, held, profile.gain),
    holdUntil,
    releaseUntil: Math.max(holdUntil + profile.release, previous?.releaseUntil ?? at),
  }
}
