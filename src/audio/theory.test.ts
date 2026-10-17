import { describe, expect, it } from 'vitest'
import { chapterScale, chordAt, chordDuration, midiFrequency, stepNote, type Chapter } from './theory'

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
