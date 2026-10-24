// 第五章交接谱面；运行时在T6.18按此接入，不由站点导入文档。
export function chapterFiveScore() {
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

export function finaleNotes() {
  // 十五灯演出后的收束；只按通关事实触发，不按正确连接触发。
  return [77, 81, 83, 84, 89].map((note, i) => ({
    note,
    at: i * 0.24,
    duration: i === 4 ? 1.8 : 0.6,
    velocity: 0.24,
    pan: 0,
  }))
}
