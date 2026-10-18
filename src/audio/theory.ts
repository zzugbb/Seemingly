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
const courtyardMelody = [
  [2, 69, 0.65],
  [4.8, 76, 0.42],
  [8.3, 71, 0.38],
  [14, 69, 0.5],
  [18, 67, 0.38],
  [21, 64, 0.45],
  [26, 67, 0.5],
  [29, 64, 0.36],
  [37.5, 74, 0.54],
  [41, 69, 0.4],
  [45, 67, 0.35],
  [51, 69, 0.55],
  [54.5, 65, 0.4],
  [58, 64, 0.32],
  [63.5, 64, 0.45],
  [67, 60, 0.32],
  [74, 64, 0.5],
  [77, 71, 0.36],
  [81, 69, 0.45],
  [86, 64, 0.38],
  [89.5, 59, 0.3],
  [92, 57, 0.3],
] as const
export const COURTYARD_NOTE_COUNT = courtyardMelody.length
export const COURTYARD_GAIN = 2.2

export function courtyardChordAt(seconds: number): Chord {
  return courtyardChords[Math.floor(Math.max(0, seconds) / COURTYARD_CHORD_SECONDS) % courtyardChords.length]
}

export function courtyardNote(index: number): {
  at: number
  note: number
  duration: number
  velocity: number
  pan: number
} {
  const count = Math.max(0, Math.floor(index))
  const [at, note, velocity] = courtyardMelody[count % COURTYARD_NOTE_COUNT]
  return {
    at: Math.floor(count / COURTYARD_NOTE_COUNT) * COURTYARD_SECONDS + at,
    note,
    duration: 5.5,
    velocity,
    pan: count % 2 === 0 ? -0.22 : 0.18,
  }
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
