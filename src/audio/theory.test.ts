import { describe, expect, it } from 'vitest'
import {
  chapterScale,
  chordAt,
  chordDuration,
  courtyardNote,
  courtyardChordAt,
  COURTYARD_NOTE_COUNT,
  COURTYARD_SECONDS,
  midiFrequency,
  stepNote,
  type Chapter,
} from './theory'

describe('五章调式与频率', () => {
  it.each([
    [1, ['Cmaj9', 'Am9', 'Fmaj9', 'Gsus2'], [60, 62, 64, 67, 69]],
    [2, ['Am9', 'Fmaj7', 'Cmaj7', 'G6'], [57, 60, 62, 64, 67]],
    [3, ['Dm9', 'G7sus4', 'Em7', 'Am7'], [62, 64, 65, 67, 69, 71, 72]],
    [4, ['E♭maj9', 'Cm9', 'A♭maj7', 'B♭sus2'], [63, 65, 67, 70, 72]],
    [5, ['Fmaj7♯11', 'Dm9', 'B♭maj7', 'Csus4'], [65, 67, 69, 71, 72, 74, 76]],
  ] as const)('第 %i 章的四和弦与音阶', (chapter, names, scale) => {
    expect([0, 8, 16, 24].map((time) => chordAt(chapter, time).name)).toEqual(names)
    expect(chapterScale(chapter)).toEqual(scale)
    for (const time of [0, 8, 16, 24]) {
      const chord = chordAt(chapter, time)
      expect(chord.notes.length).toBeGreaterThanOrEqual(3)
      expect(chord.notes.length).toBeLessThanOrEqual(4)
      for (const note of chord.notes) expect(midiFrequency(note + 12)).toBeCloseTo(midiFrequency(note) * 2)
    }
  })
  it('标准音、半音与降号和弦音高正确', () => {
    expect(midiFrequency(69)).toBe(440)
    expect(midiFrequency(60)).toBeCloseTo(261.625565)
    expect(midiFrequency(61) / midiFrequency(60)).toBeCloseTo(2 ** (1 / 12))
    expect(chordAt(4, 0).notes).toEqual([51, 55, 62, 65])
    expect(chordAt(5, 0).notes).toEqual([53, 57, 64, 71])
  })
  it('边界按八秒换和弦，四个循环；挑战速度慢 10%', () => {
    for (const chapter of [1, 2, 3, 4, 5] as Chapter[]) {
      expect(chordAt(chapter, -1)).toEqual(chordAt(chapter, 0))
      expect(chordAt(chapter, 7.999)).toEqual(chordAt(chapter, 0))
      expect(chordAt(chapter, 32)).toEqual(chordAt(chapter, 0))
      expect(chordAt(chapter, 8, true)).toEqual(chordAt(chapter, 0))
      expect(chordAt(chapter, chordDuration(true), true)).toEqual(chordAt(chapter, 8))
      expect(chordAt(chapter, chordDuration(true) * 4, true)).toEqual(chordAt(chapter, 0))
    }
  })
  it('脚步按当前和弦上行循环，换和弦即使用新音组', () => {
    const chord = chordAt(1, 0)
    expect(Array.from({ length: 6 }, (_, step) => stepNote(chord, step))).toEqual([60, 64, 71, 74, 60, 64])
    expect(stepNote(chordAt(2, 8), 4)).toBe(53)
  })
})

describe('空庭声景乐句', () => {
  it('九十六秒乐句按时间前进，保留停顿且循环边界连续', () => {
    const notes = Array.from({ length: COURTYARD_NOTE_COUNT * 2 }, (_, index) => courtyardNote(index))
    for (let i = 1; i < notes.length; i++) expect(notes[i].at).toBeGreaterThan(notes[i - 1].at)
    expect(notes.slice(1).some((note, i) => note.at - notes[i].at >= 8)).toBe(true)
    for (let i = 0; i < COURTYARD_NOTE_COUNT; i++) {
      expect(notes[i + COURTYARD_NOTE_COUNT].at - notes[i].at).toBe(COURTYARD_SECONDS)
      expect(notes[i + COURTYARD_NOTE_COUNT].note).toBe(notes[i].note)
    }
    expect(
      notes.every(
        ({ note, duration, velocity, pan }) =>
          note >= 57 && note <= 76 && duration > 0 && velocity > 0 && velocity <= 1 && Math.abs(pan) <= 1,
      ),
    ).toBe(true)
  })
  it('效果音与实际低音区和弦一致，十二秒边界与循环恢复正确', () => {
    expect(courtyardChordAt(-1)).toEqual(courtyardChordAt(0))
    expect(courtyardChordAt(11.999)).toEqual(courtyardChordAt(0))
    expect(courtyardChordAt(12)).not.toEqual(courtyardChordAt(0))
    expect(courtyardChordAt(COURTYARD_SECONDS)).toEqual(courtyardChordAt(0))
    expect(courtyardChordAt(0).notes[0]).toBe(45)
    for (let i = 0; i < 8; i++)
      expect(courtyardChordAt(i * 12).notes.every((note) => note >= 41 && note <= 64)).toBe(true)
  })
})

describe('启程声景乐句', () => {
  it('使用独立的明亮乐句，共用九十六秒结构与暂停恢复边界', () => {
    expect(courtyardChordAt(0, 1).name).toBe('Cadd9')
    expect(courtyardChordAt(11.999, 1)).toEqual(courtyardChordAt(0, 1))
    expect(courtyardChordAt(12, 1).name).toBe('G6')
    expect(courtyardChordAt(COURTYARD_SECONDS, 1)).toEqual(courtyardChordAt(0, 1))
    const scale = new Set([0, 2, 4, 5, 7, 9, 11])
    for (let i = 0; i < COURTYARD_NOTE_COUNT; i++) {
      const note = courtyardNote(i, 1)
      expect(scale.has(note.note % 12)).toBe(true)
      expect(note.note).toBeGreaterThanOrEqual(69)
      expect(note.note).toBeLessThanOrEqual(84)
      expect(note.at).toBe(courtyardNote(i, 2).at)
      expect(courtyardNote(i + COURTYARD_NOTE_COUNT, 1).at).toBe(note.at + COURTYARD_SECONDS)
      expect(courtyardNote(i + COURTYARD_NOTE_COUNT, 1).note).toBe(note.note)
    }
    expect(courtyardNote(0, 1).note).not.toBe(courtyardNote(0, 2).note)
    expect(courtyardNote(0)).toEqual(courtyardNote(0, 2))
  })
})
