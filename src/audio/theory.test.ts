import { describe, expect, it } from 'vitest'
import {
  chapterScale,
  chordAt,
  chordDuration,
  chapterSealNotes,
  courtyardClock,
  courtyardNote,
  courtyardPulse,
  COURTYARD_PULSE_COUNT,
  musicStage,
  pulseActive,
  successNotes,
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
    expect(notes.slice(1).some((note, i) => note.at - notes[i].at >= 4)).toBe(true)
    for (let i = 0; i < COURTYARD_NOTE_COUNT; i++) {
      expect(notes[i + COURTYARD_NOTE_COUNT].at - notes[i].at).toBe(COURTYARD_SECONDS)
      expect(notes[i + COURTYARD_NOTE_COUNT].note).toBe(notes[i].note)
    }
    expect(
      notes.every(
        ({ note, duration, velocity, pan }) =>
          note >= 64 && note <= 81 && duration > 0 && velocity > 0 && velocity <= 1 && Math.abs(pan) <= 1,
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

describe('第三、四章乐句', () => {
  it('循环、和弦和拍点跟随章节速度，前两章仍是八十拍与九十六秒', () => {
    expect(courtyardClock(1)).toEqual(courtyardClock(2))
    expect(courtyardClock(2)).toMatchObject({
      bpm: 80,
      seconds: 96,
      chordSeconds: 12,
      beatSeconds: 0.75,
      noteCount: 51,
    })
    expect(courtyardClock(3).bpm).toBe(88)
    expect(courtyardClock(4).bpm).toBe(96)
    for (const chapter of [3, 4] as const) {
      const clock = courtyardClock(chapter)
      expect(clock.seconds).toBeCloseTo(clock.beatSeconds * 128)
      expect(clock.chordSeconds).toBeCloseTo(clock.beatSeconds * 16)
      expect(clock.noteCount).toBe(51)
      expect(clock.seconds).not.toBe(96)
    }
  })

  it('两章分别写旋律、起音和调式，跨循环接上同一句', () => {
    for (const chapter of [3, 4] as const) {
      const clock = courtyardClock(chapter)
      const mode = new Set(chapter === 3 ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10])
      for (let index = 0; index < clock.noteCount; index++) {
        const note = courtyardNote(index, chapter)
        expect(mode.has(note.note % 12)).toBe(true)
        expect(note.at).toBeGreaterThanOrEqual(0)
        expect(note.at).toBeLessThan(clock.seconds)
        expect(note.duration).toBeGreaterThan(0)
        const next = courtyardNote(index + clock.noteCount, chapter)
        expect(next.at).toBeCloseTo(note.at + clock.seconds)
        expect(next.note).toBe(note.note)
      }
      expect(courtyardChordAt(clock.seconds, chapter)).toEqual(courtyardChordAt(0, chapter))
      expect(courtyardChordAt(-1, chapter)).toEqual(courtyardChordAt(0, chapter))
      expect(courtyardChordAt(clock.chordSeconds, chapter)).not.toEqual(courtyardChordAt(0, chapter))
    }
    expect(courtyardNote(0, 3).note).not.toBe(courtyardNote(0, 4).note)
    expect(courtyardNote(0, 3).at).not.toBe(courtyardNote(0, 2).at)
    const intervals = (chapter: 3 | 4) =>
      Array.from({ length: 51 }, (_, index) => courtyardNote(index, chapter).note).map((note, index, notes) =>
        index === 0 ? 0 : note - notes[index - 1],
      )
    expect(intervals(3)).not.toEqual(intervals(4))
  })

  it('分解音按章节拍长循环，章末四音晚于评价声', () => {
    for (const chapter of [3, 4] as const) {
      const clock = courtyardClock(chapter)
      const pulses = Math.round(clock.seconds / clock.beatSeconds)
      for (let index = 0; index < pulses; index++) {
        const note = courtyardPulse(index, chapter)
        const chord = courtyardChordAt(note.at, chapter)
        expect(chord.notes.some((pitch) => pitch % 12 === note.note % 12)).toBe(true)
        expect(courtyardPulse(index + pulses, chapter).at).toBeCloseTo(note.at + clock.seconds)
      }
      const seal = chapterSealNotes(chapter)
      expect(seal.map((note) => note.at)).toEqual([2.1, 2.34, 2.58, 3.05])
      expect(seal[0].at).toBeGreaterThan(0.85)
      expect(seal.every((note) => note.velocity < 0.65)).toBe(true)
      const mode = new Set(
        (chapter === 3 ? [62, 64, 65, 67, 69, 71, 72] : [63, 65, 67, 68, 70, 72, 74]).map((note) => note % 12),
      )
      expect(seal.every((note) => mode.has(note.note % 12))).toBe(true)
    }
    expect(chapterSealNotes(3).map((note) => note.note)).not.toEqual(chapterSealNotes(4).map((note) => note.note))
  })
})

describe('推进乐句与成功层次', () => {
  it('八段乐句保留应答和休止，两个章节在同一节拍循环', () => {
    expect(COURTYARD_NOTE_COUNT).toBe(51)
    for (const chapter of [1, 2] as const) {
      for (let index = 0; index < COURTYARD_NOTE_COUNT; index++) {
        const note = courtyardNote(index, chapter)
        expect(note.at % 0.375).toBe(0)
        expect(note.duration).toBeGreaterThan(0)
        expect(courtyardNote(index + COURTYARD_NOTE_COUNT, chapter).at).toBe(note.at + 96)
        expect(courtyardNote(index + COURTYARD_NOTE_COUNT, chapter).note).toBe(note.note)
      }
    }
  })
  it('律动每12秒由4音到8音再到12音，完成后停止，不按操作次数升级', () => {
    const slots = Array.from({ length: 16 }, (_, i) => i)
    expect(
      ['explore', 'gather', 'ready', 'complete'].map(
        (stage) => slots.filter((i) => pulseActive(i, stage as Parameters<typeof pulseActive>[1])).length,
      ),
    ).toEqual([4, 8, 12, 0])
    for (const chapter of [1, 2] as const) {
      for (let index = 0; index < COURTYARD_PULSE_COUNT; index++) {
        const note = courtyardPulse(index, chapter)
        expect(note.note).toBeGreaterThanOrEqual(60)
        const chord = courtyardChordAt(note.at, chapter)
        expect(chord.notes.some((pitch) => pitch % 12 === note.note % 12)).toBe(true)
        expect(courtyardPulse(index + COURTYARD_PULSE_COUNT, chapter).at).toBeCloseTo(note.at + 96)
      }
    }
  })
  it('进度只由实际收光和通关决定；撤销、重开可退回，空目标不自动奏成功层', () => {
    expect(musicStage({ required: 2, requiredCollected: 0, collected: 0 })).toBe('explore')
    expect(musicStage({ required: 2, requiredCollected: 0, collected: 1 })).toBe('gather')
    expect(musicStage({ required: 2, requiredCollected: 1, collected: 1 })).toBe('gather')
    expect(musicStage({ required: 2, requiredCollected: 2, collected: 2 })).toBe('ready')
    expect(musicStage({ required: 2, requiredCollected: 2, collected: 2 }, true)).toBe('complete')
    expect(musicStage({ required: 0, requiredCollected: 0, collected: 0 })).toBe('explore')
  })
  it('普通、选做、必需集齐、点灯与新增评价有不同音序，评价在点灯后进入', () => {
    const chord = courtyardChordAt(0)
    const voices = (sound: Parameters<typeof successNotes>[0], count?: number) => successNotes(sound, chord, count)
    expect(
      ['orb', 'optionalOrb', 'ready', 'lantern'].map((sound) => voices(sound as Parameters<typeof voices>[0]).length),
    ).toEqual([2, 3, 3, 4])
    expect(voices('optionalOrb').map((note) => note.note)).not.toEqual(voices('ready').map((note) => note.note))
    expect([0, 1, 2, 3, 4].map((count) => voices('rating', count).length)).toEqual([0, 1, 2, 3, 3])
    expect(voices('rating', 3)[0].at).toBeGreaterThan(voices('lantern').at(-1)!.at)
    for (const sound of ['orb', 'optionalOrb', 'ready', 'lantern', 'rating'] as const) {
      for (const note of voices(sound, 3)) {
        expect(note.velocity).toBeGreaterThan(0)
        expect(note.velocity).toBeLessThanOrEqual(1)
        expect(note.duration).toBeGreaterThan(0)
        expect(midiFrequency(note.note)).toBeGreaterThan(100)
      }
    }
  })
})
