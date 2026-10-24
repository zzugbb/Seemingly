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
export const COURTYARD_GAIN = 3.3
export const COURTYARD_PAD_GAIN = 0.08
export const COURTYARD_PAD_HIGHPASS = 180
export const COURTYARD_MELODY_GAIN = 0.5
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

export interface CourtyardClock {
  bpm: number
  seconds: number
  chordSeconds: number
  beatSeconds: number
  noteCount: number
}
function chapterFiveScore() {
  const bpm = 84
  const beat = 60 / bpm
  const phrases = [
    [77, 81, 83, 84, 81, 79],
    [81, 79, 77, 76, 74, 77],
    [79, 83, 86, 84, 83, 81, 79],
    [76, 79, 83, 86, 84, 79],
    [77, 81, 84, 83, 86, 84, 81],
    [76, 79, 83, 81, 79, 76],
    [79, 83, 86, 88, 86, 83, 79],
    [77, 81, 83, 84, 79, 77],
  ]
  const onsets = [
    [0, 2, 5, 7, 10, 12],
    [1, 3, 6, 8, 11, 14],
    [0, 1.5, 4, 6, 9, 12, 14],
    [1, 4, 7, 9.5, 12, 14],
    [0, 3, 5, 7, 10, 12, 15],
    [1, 3, 6, 8, 11, 14],
    [0, 2, 5, 8, 10, 12, 14],
    [0, 3, 6, 8, 11, 13],
  ]
  const chords = [
    { name: 'Fmaj9#11', notes: [53, 57, 60, 64, 71] },
    { name: 'Dm9', notes: [50, 53, 57, 60, 64] },
    { name: 'G6', notes: [55, 59, 62, 64] },
    { name: 'Cmaj9', notes: [48, 52, 55, 59, 62] },
    { name: 'Fmaj9#11', notes: [53, 57, 60, 64, 71] },
    { name: 'Em7', notes: [52, 55, 59, 62] },
    { name: 'Cmaj9', notes: [48, 52, 55, 59, 62] },
    { name: 'Fmaj9#11', notes: [53, 57, 60, 64, 71] },
  ]
  const notes = phrases.flatMap((phrase, section) =>
    phrase.map((note, index) => ({
      at: (section * 16 + onsets[section][index]) * beat,
      note,
      duration: (index === phrase.length - 1 ? 2.8 : 1.8) * beat,
      velocity: index === 0 ? 0.68 : 0.58,
      pan: index % 2 ? 0.16 : -0.16,
    })),
  )
  return {
    bpm,
    beat,
    seconds: 128 * beat,
    chordSeconds: 16 * beat,
    scale: [65, 67, 69, 71, 72, 74, 76],
    chords,
    onsets,
    notes,
  }
}

const finalScore = chapterFiveScore()
export const finaleChord: Chord = finalScore.chords[0]
export function finaleNotes() {
  // 十五灯演出后的收束；只按通关事实触发，不按正确连接触发。
  return [77, 81, 83, 84, 89].map((note, i) => ({
    note,
    at: i * 0.18,
    duration: i === 4 ? 1.8 : 0.6,
    velocity: 0.24,
    pan: 0,
  }))
}

const openingClock: CourtyardClock = {
  bpm: 80,
  seconds: COURTYARD_SECONDS,
  chordSeconds: COURTYARD_CHORD_SECONDS,
  beatSeconds: COURTYARD_BEAT_SECONDS,
  noteCount: COURTYARD_NOTE_COUNT,
}
export function courtyardClock(chapter: Chapter): CourtyardClock {
  if (chapter === 5)
    return {
      bpm: finalScore.bpm,
      seconds: finalScore.seconds,
      chordSeconds: finalScore.chordSeconds,
      beatSeconds: finalScore.beat,
      noteCount: finalScore.notes.length,
    }
  if (chapter !== 3 && chapter !== 4) return openingClock
  const bpm = chapter === 3 ? 88 : 96
  const beatSeconds = 60 / bpm
  return { bpm, beatSeconds, seconds: beatSeconds * 128, chordSeconds: beatSeconds * 16, noteCount: 51 }
}

const risePhrases = [
  [74, 77, 81, 79, 76, 74],
  [76, 79, 83, 81, 79, 76],
  [72, 76, 79, 83, 81, 79, 76, 74],
  [76, 79, 81, 79, 76, 72],
  [76, 79, 83, 86, 84, 83, 79, 76],
  [79, 83, 86, 84, 83, 79],
  [81, 84, 83, 81, 77, 76],
  [81, 77, 76, 72, 74],
]
const weightPhrases = [
  [75, 79, 82, 79, 77, 75],
  [77, 82, 86, 84, 82, 79],
  [79, 82, 87, 86, 84, 82, 79, 75],
  [80, 84, 87, 84, 82, 80],
  [77, 80, 84, 87, 89, 87, 84, 80],
  [79, 82, 87, 86, 82, 79],
  [77, 82, 86, 84, 82, 77],
  [82, 79, 77, 79, 75],
]
const riseOnsets = [
  [0.5, 2, 4, 7, 9, 12],
  [1, 3, 5.5, 8, 10, 13],
  [0.5, 2, 3.5, 5, 7.5, 9, 11, 13],
  [1, 3, 6, 8, 11, 13],
  [0, 1.5, 3, 5, 7, 9.5, 11, 13],
  [1, 3, 5.5, 8, 10, 13],
  [0.5, 3, 5, 7, 10, 12],
  [0.5, 3, 6, 9, 12],
]
const weightOnsets = [
  [0, 1.5, 3, 6, 8, 11],
  [0.5, 2, 4.5, 6, 9, 12],
  [0, 1.5, 3, 4.5, 6, 8, 10.5, 13],
  [0, 2, 4.5, 7, 9, 12],
  [0.5, 2, 3.5, 5, 7.5, 9, 11, 13],
  [0, 1.5, 4, 6, 9, 12],
  [0.5, 2, 4.5, 7, 9, 12],
  [0, 2, 5, 8, 12],
]
const riseChords: readonly Chord[] = [
  { name: 'Dm(add9)', notes: [50, 57, 60, 64] },
  { name: 'G6', notes: [43, 55, 59, 64] },
  { name: 'Cmaj7', notes: [48, 55, 59, 64] },
  { name: 'Am7', notes: [45, 55, 60, 64] },
  { name: 'Em7', notes: [52, 59, 62, 67] },
  { name: 'Gadd9', notes: [43, 57, 59, 62] },
  { name: 'Dm9', notes: [50, 57, 60, 64] },
  { name: 'Dsus2', notes: [50, 57, 64, 69] },
]
const weightChords: readonly Chord[] = [
  { name: 'Ebadd9', notes: [51, 58, 65, 67] },
  { name: 'Bb6', notes: [46, 58, 62, 67] },
  { name: 'Cm7', notes: [48, 58, 63, 67] },
  { name: 'Abmaj7', notes: [44, 55, 60, 63] },
  { name: 'Fm9', notes: [53, 60, 63, 67] },
  { name: 'Eb/G', notes: [55, 58, 63, 67] },
  { name: 'Bbadd9', notes: [46, 58, 60, 65] },
  { name: 'Ebadd9', notes: [51, 58, 65, 67] },
]
const chapterPhrases = (chapter: 3 | 4) => {
  const phrases = chapter === 3 ? risePhrases : weightPhrases
  const onsets = chapter === 3 ? riseOnsets : weightOnsets
  const beat = courtyardClock(chapter).beatSeconds
  return phrases.flatMap((phrase, section) =>
    phrase.map((note, index) => ({
      at: (section * 16 + onsets[section][index]) * beat,
      note,
      duration: (index === phrase.length - 1 ? 4.6 : 3) * beat,
      velocity: (chapter === 3 ? 0.61 : 0.65) + (index % 3 === 0 ? 0.1 : 0),
      pan: (section % 2 === 0 ? -1 : 1) * 0.18,
    })),
  )
}
const riseNotes = chapterPhrases(3)
const weightNotes = chapterPhrases(4)

export function courtyardChordAt(seconds: number, chapter: Chapter = 2): Chord {
  const time = Math.max(0, seconds)
  if (chapter === 5) return finalScore.chords[Math.floor(time / finalScore.chordSeconds) % finalScore.chords.length]
  if (chapter === 3 || chapter === 4) {
    const chords = chapter === 3 ? riseChords : weightChords
    return chords[Math.floor(time / courtyardClock(chapter).chordSeconds) % chords.length]
  }
  const chords = chapter === 1 ? dawnChords : courtyardChords
  return chords[Math.floor(time / COURTYARD_CHORD_SECONDS) % chords.length]
}
export function courtyardNote(index: number, chapter: Chapter = 2): ScoreNote {
  const count = Math.max(0, Math.floor(index))
  if (chapter === 5) {
    const note = finalScore.notes[count % finalScore.notes.length]
    return { ...note, at: note.at + Math.floor(count / finalScore.notes.length) * finalScore.seconds }
  }
  if (chapter === 3 || chapter === 4) {
    const clock = courtyardClock(chapter)
    const note = (chapter === 3 ? riseNotes : weightNotes)[count % clock.noteCount]
    return { ...note, at: note.at + Math.floor(count / clock.noteCount) * clock.seconds }
  }
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
  const beat = courtyardClock(chapter).beatSeconds
  const at = count * beat + beat / 2
  const chord = courtyardChordAt(at, chapter)
  let note = chord.notes[[1, 2, 3, 2, 0, 2, 1, 3][count % 8]]
  while (note < 60) note += 12
  return { at, note, duration: 0.7, velocity: count % 4 === 0 ? 1 : 0.76, pan: count % 2 === 0 ? -0.3 : 0.3 }
}
export function chapterSealNotes(chapter: 3 | 4): ScoreNote[] {
  const root = chapter === 3 ? 62 : 63
  return [24, 31, chapter === 3 ? 39 : 40, 36].map((interval, i) => ({
    at: [2.1, 2.34, 2.58, 3.05][i],
    note: root + interval - 12,
    duration: i === 3 ? 2.3 : 1.4,
    velocity: [0.36, 0.32, 0.3, 0.38][i],
    pan: i % 2 === 0 ? -0.12 : 0.12,
  }))
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
