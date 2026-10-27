// 第三、四章独立谱面基准，供正式校验器比对；不由站点导入，不能替代试听。
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
const scores = {
  3: {
    title: '升起·应答',
    bpm: 88,
    scale: [62, 64, 65, 67, 69, 71, 72],
    chords: [
      { name: 'Dm(add9)', notes: [50, 57, 60, 64] },
      { name: 'G6', notes: [43, 55, 59, 64] },
      { name: 'Cmaj7', notes: [48, 55, 59, 64] },
      { name: 'Am7', notes: [45, 55, 60, 64] },
      { name: 'Em7', notes: [52, 59, 62, 67] },
      { name: 'Gadd9', notes: [43, 57, 59, 62] },
      { name: 'Dm9', notes: [50, 57, 60, 64] },
      { name: 'Dsus2', notes: [50, 57, 64, 69] },
    ],
    phrases: risePhrases,
    onsets: riseOnsets,
  },
  4: {
    title: '推动·归灯',
    bpm: 96,
    scale: [63, 65, 67, 68, 70, 72, 74],
    chords: [
      { name: 'Ebadd9', notes: [51, 58, 65, 67] },
      { name: 'Bb6', notes: [46, 58, 62, 67] },
      { name: 'Cm7', notes: [48, 58, 63, 67] },
      { name: 'Abmaj7', notes: [44, 55, 60, 63] },
      { name: 'Fm9', notes: [53, 60, 63, 67] },
      { name: 'Eb/G', notes: [55, 58, 63, 67] },
      { name: 'Bbadd9', notes: [46, 58, 60, 65] },
      { name: 'Ebadd9', notes: [51, 58, 65, 67] },
    ],
    phrases: weightPhrases,
    onsets: weightOnsets,
  },
}
export function chapterScore(chapter) {
  const score = scores[chapter]
  if (!score) throw new Error('文档乐谱只包含第三、四章')
  const beat = 60 / score.bpm
  return {
    ...score,
    beat,
    seconds: 128 * beat,
    chordSeconds: 16 * beat,
    notes: score.phrases.flatMap((phrase, section) =>
      phrase.map((note, index) => ({
        at: (section * 16 + score.onsets[section][index]) * beat,
        note,
        duration: (index === phrase.length - 1 ? 4.6 : 3) * beat,
        velocity: (chapter === 3 ? 0.61 : 0.65) + (index % 3 === 0 ? 0.1 : 0),
        pan: (section % 2 === 0 ? -1 : 1) * 0.18,
      })),
    ),
  }
}
export function chapterSeal(chapter) {
  const root = chapter === 3 ? 62 : 63
  return [24, 31, chapter === 3 ? 39 : 40, 36].map((interval, i) => ({
    at: [2.1, 2.34, 2.58, 3.05][i],
    note: root + interval - 12,
    duration: i === 3 ? 2.3 : 1.4,
    velocity: [0.36, 0.32, 0.3, 0.38][i],
    pan: i % 2 === 0 ? -0.12 : 0.12,
  }))
}
