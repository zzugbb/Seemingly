export type Chapter = 1 | 2 | 3 | 4 | 5
export interface Chord {
  name: string
  notes: readonly number[]
}
export const CHORD_SECONDS = 8
export type Soundtrack = 'generative' | 'courtyard'

const COURTYARD_TIMES = [1, 3, 5.5, 8, 17, 19.5, 22, 25]
const COURTYARD_NOTES = [69, 76, 74, 72, 69, 76, 71, 69]

export function courtyardNote(index: number): { at: number; note: number; duration: number } {
  const count = Math.max(0, Math.floor(index))
  return {
    at: Math.floor(count / 8) * 32 + COURTYARD_TIMES[count % 8],
    note: COURTYARD_NOTES[count % 8],
    duration: 2.4,
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
