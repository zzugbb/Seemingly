export type Chapter = 1 | 2 | 3 | 4 | 5
export interface Chord {
  name: string
  notes: readonly number[]
}
export const CHORD_SECONDS = 8
export type Soundtrack = 'generative' | 'courtyard'

export const COURTYARD_SECONDS = 96
export const COURTYARD_CHORD_SECONDS = 12

const courtyardChords: readonly Chord[] = [
  { name: 'Am(add9)', notes: [45, 52, 59, 60] },
  { name: 'Fmaj7', notes: [41, 52, 57, 60] },
  { name: 'Cmaj7', notes: [48, 55, 59, 64] },
  { name: 'Gsus2', notes: [43, 50, 57, 62] },
  { name: 'Dm9', notes: [50, 57, 60, 64] },
  { name: 'Fmaj7', notes: [41, 52, 57, 60] },
  { name: 'Am(add9)', notes: [45, 52, 59, 60] },
  { name: 'Asus2', notes: [45, 52, 59, 64] },
]
const dawnChords: readonly Chord[] = [
  { name: 'Cadd9', notes: [48, 55, 62, 64] },
  { name: 'G6', notes: [43, 55, 59, 64] },
  { name: 'Am7', notes: [45, 55, 60, 64] },
  { name: 'Fmaj7', notes: [41, 52, 57, 60] },
  { name: 'Dm9', notes: [50, 57, 60, 64] },
  { name: 'Cmaj7/E', notes: [52, 55, 59, 60] },
  { name: 'Fmaj7', notes: [41, 52, 57, 60] },
  { name: 'Cadd9', notes: [48, 55, 62, 64] },
]
const phraseTimes = [0.75, 2.25, 3.75, 4.5, 6, 7.5, 9, 10.5]
const dawnPhrases = [
  [72, 76, 79, 76, 74, 72],
  [71, 74, 79, 76, 74, 71],
  [72, 76, 81, 79, 76, 74, 72, 69],
  [69, 72, 77, 76, 72, 69],
  [74, 77, 81, 79, 77, 76, 74, 72],
  [76, 79, 84, 83, 79, 76],
  [77, 81, 79, 77, 76, 72],
  [79, 76, 74, 76, 72],
]
const courtyardPhrases = [
  [69, 76, 71, 72, 71, 69],
  [69, 72, 76, 74, 72, 69],
  [67, 71, 76, 79, 76, 74, 71, 67],
  [69, 74, 79, 76, 74, 69],
  [69, 74, 77, 81, 77, 76, 74, 72],
  [69, 72, 77, 76, 72, 69],
  [71, 76, 79, 76, 72, 69],
  [76, 71, 69, 64, 69],
]
const phraseVelocities = [0.58, 0.68, 0.62, 0.74, 0.72, 0.6, 0.72, 0.52]
const melody = courtyardPhrases.flatMap((phrase, section) => phrase.map((note, index) => ({ section, index, note })))
export const COURTYARD_NOTE_COUNT = melody.length
export const COURTYARD_GAIN = 8.8
export const COURTYARD_PAD_GAIN = 0.08
export const COURTYARD_PAD_HIGHPASS = 180
export const COURTYARD_MELODY_GAIN = 1.2
export const COURTYARD_BEAT_SECONDS = 0.75
export const COURTYARD_PULSE_COUNT = COURTYARD_SECONDS / COURTYARD_BEAT_SECONDS
export type MusicStage = 'explore' | 'gather' | 'ready' | 'complete'
export interface OrbProgress {
  required: number
  requiredCollected: number
  collected: number
}
export interface ScoreNote {
  at: number
  note: number
  duration: number
  velocity: number
  pan: number
}
export function musicStage(progress: OrbProgress, won = false): MusicStage {
  if (won) return 'complete'
  if (progress.required > 0 && progress.requiredCollected >= progress.required) return 'ready'
  return progress.collected > 0 ? 'gather' : 'explore'
}
export function pulseActive(index: number, stage: MusicStage): boolean {
  if (stage === 'complete') return false
  if (stage === 'explore') return index % 4 === 0
  if (stage === 'gather') return index % 2 === 0
  return index % 4 !== 3
}
export const pulseLevel = (stage: MusicStage) => ({ explore: 0.55, gather: 0.8, ready: 1, complete: 0 })[stage]

export function courtyardChordAt(seconds: number, chapter: Chapter = 2): Chord {
  const chords = chapter === 1 ? dawnChords : courtyardChords
  return chords[Math.floor(Math.max(0, seconds) / COURTYARD_CHORD_SECONDS) % chords.length]
}
export function courtyardNote(index: number, chapter: Chapter = 2): ScoreNote {
  const count = Math.max(0, Math.floor(index))
  const entry = melody[count % COURTYARD_NOTE_COUNT]
  const { section, index: slot } = entry
  return {
    at: Math.floor(count / COURTYARD_NOTE_COUNT) * COURTYARD_SECONDS + section * 12 + phraseTimes[slot],
    note: chapter === 1 ? dawnPhrases[section][slot] : entry.note,
    duration: slot === courtyardPhrases[section].length - 1 ? 3.4 : 2.4,
    velocity: phraseVelocities[slot],
    pan: count % 2 === 0 ? -0.18 : 0.18,
  }
}
export function courtyardPulse(index: number, chapter: Chapter = 2): ScoreNote {
  const count = Math.max(0, Math.floor(index))
  const at = count * COURTYARD_BEAT_SECONDS + COURTYARD_BEAT_SECONDS / 2
  const chord = courtyardChordAt(at, chapter)
  let note = chord.notes[[1, 2, 3, 2, 0, 2, 1, 3][count % 8]]
  while (note < 60) note += 12
  return { at, note, duration: 0.7, velocity: count % 4 === 0 ? 1 : 0.76, pan: count % 2 === 0 ? -0.3 : 0.3 }
}
export type SuccessSound = 'orb' | 'optionalOrb' | 'ready' | 'lantern' | 'rating'
export function successNotes(sound: SuccessSound, chord: Chord, count = 1): ScoreNote[] {
  const root = chord.notes[0]
  const phrases = {
    orb: [
      [24, 0, 0.65, 0.48],
      [31, 0.1, 0.85, 0.36],
    ],
    optionalOrb: [
      [31, 0, 0.75, 0.4],
      [36, 0.1, 0.95, 0.35],
      [38, 0.24, 1.2, 0.3],
    ],
    ready: [
      [24, 0, 0.9, 0.45],
      [31, 0.12, 1, 0.4],
      [36, 0.24, 1.2, 0.35],
    ],
    lantern: [
      [12, 0, 1.3, 0.65],
      [19, 0.12, 1.4, 0.55],
      [24, 0.26, 1.6, 0.5],
      [31, 0.42, 2, 0.42],
    ],
    rating: [24, 31, 36]
      .slice(3 - Math.max(0, Math.min(3, Math.floor(count))))
      .map((interval, i) => [interval, 0.85 + i * 0.17, 0.75, 0.38]),
  }
  return phrases[sound].map(([interval, at, duration, velocity], i) => ({
    note: root + interval,
    at,
    duration,
    velocity,
    pan: i % 2 === 0 ? -0.12 : 0.12,
  }))
}

// 九和弦省略五音，以四音声部保留根音、三音、七音和九音。
const progressions: Record<Chapter, readonly Chord[]> = {
  1: [
    { name: 'Cmaj9', notes: [60, 64, 71, 74] },
    { name: 'Am9', notes: [57, 60, 67, 71] },
    { name: 'Fmaj9', notes: [53, 57, 64, 67] },
    { name: 'Gsus2', notes: [55, 57, 62] },
  ],
  2: [
    { name: 'Am9', notes: [57, 60, 67, 71] },
    { name: 'Fmaj7', notes: [53, 57, 60, 64] },
    { name: 'Cmaj7', notes: [60, 64, 67, 71] },
    { name: 'G6', notes: [55, 59, 62, 64] },
  ],
  3: [
    { name: 'Dm9', notes: [50, 53, 60, 64] },
    { name: 'G7sus4', notes: [55, 60, 62, 65] },
    { name: 'Em7', notes: [52, 55, 59, 62] },
    { name: 'Am7', notes: [57, 60, 64, 67] },
  ],
  4: [
    { name: 'E♭maj9', notes: [51, 55, 62, 65] },
    { name: 'Cm9', notes: [48, 51, 58, 62] },
    { name: 'A♭maj7', notes: [56, 60, 63, 67] },
    { name: 'B♭sus2', notes: [58, 60, 65] },
  ],
  5: [
    { name: 'Fmaj7♯11', notes: [53, 57, 64, 71] },
    { name: 'Dm9', notes: [50, 53, 60, 64] },
    { name: 'B♭maj7', notes: [58, 62, 65, 69] },
    { name: 'Csus4', notes: [60, 65, 67] },
  ],
}
const scales: Record<Chapter, readonly number[]> = {
  1: [60, 62, 64, 67, 69],
  2: [57, 60, 62, 64, 67],
  3: [62, 64, 65, 67, 69, 71, 72],
  4: [63, 65, 67, 70, 72],
  5: [65, 67, 69, 71, 72, 74, 76],
}
export const midiFrequency = (note: number) => 440 * 2 ** ((note - 69) / 12)
export const chapterScale = (chapter: Chapter) => scales[chapter]
export const chordDuration = (challenge = false) => CHORD_SECONDS / (challenge ? 0.9 : 1)
export function chordAt(chapter: Chapter, seconds: number, challenge = false): Chord {
  return progressions[chapter][Math.floor(Math.max(0, seconds) / chordDuration(challenge)) % 4]
}
export function stepNote(chord: Chord, step: number): number {
  return chord.notes[((Math.floor(step) % chord.notes.length) + chord.notes.length) % chord.notes.length]
}
