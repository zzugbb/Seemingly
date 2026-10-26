import { LevelSim } from '../game/core/sim'
import type { LevelDef } from '../game/levels/types'
import { palette } from '../game/render/palette'
import type { JourneyStats } from './journey'

export const JOURNEY_WIDTH = 1080
export const JOURNEY_HEIGHT = 2100
export const SCENE_HEIGHT = 1000

export function journeyScene(level: LevelDef): LevelSim {
  const sim = new LevelSim(level)
  for (const step of level.solution) {
    const command = step.type === 'walk' ? { type: 'walk' as const, tileId: sim.tileAt(step.to)?.id ?? '' } : step
    if (sim.command(command) !== 'ok') throw new Error('无法准备结局画面')
    for (let frame = 0; frame < 800 && !sim.isIdle(); frame++) sim.update(1 / 30)
    if (!sim.isIdle()) throw new Error('结局画面尚未就绪')
  }
  if (!sim.state().won) throw new Error('结局画面尚未完成')
  return sim
}

export async function journeyImage(scene: HTMLCanvasElement, stats: JourneyStats): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = JOURNEY_WIDTH
  canvas.height = JOURNEY_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法生成图片')
  ctx.fillStyle = palette.journeyPaper
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const text = (value: string, x: number, y: number, size: number, weight = 400, color = palette.journeyInk) => {
    ctx.fillStyle = color
    ctx.font = `${weight} ${size}px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif`
    ctx.fillText(value, x, y)
  }
  text('S E E M I N G L Y', 72, 92, 30, 400, palette.plumDeep)
  text('旅程成绩', 876, 92, 30, 400, palette.plumDeep)
  text('积木错位', 72, 214, 82, 500)
  text(stats.milestone, 72, 291, 42)
  const sky = ctx.createLinearGradient(0, 340, 0, 1340)
  sky.addColorStop(0, palette.journeySky)
  sky.addColorStop(1, palette.journeyHorizon)
  ctx.fillStyle = sky
  ctx.fillRect(0, 340, JOURNEY_WIDTH, SCENE_HEIGHT)
  ctx.drawImage(scene, 0, 340, JOURNEY_WIDTH, SCENE_HEIGHT)
  text('主线', 72, 1452, 36)
  text(`${stats.mainDone}/${stats.mainCount}`, 182, 1454, 64, 500)
  text('挑战', 622, 1452, 36)
  text(`${stats.challengeDone}/${stats.challengeCount}`, 732, 1454, 64, 500)
  ctx.fillStyle = palette.journeyLine
  ctx.fillRect(72, 1510, 936, 2)
  text('历史评价', 72, 1596, 36)
  ctx.textAlign = 'right'
  text(`${stats.earned}/${stats.ratingMax}`, 1008, 1596, 42, 500)
  ctx.textAlign = 'left'
  for (const [index, [label, value]] of [
    ['抵达', stats.done],
    ['全收集', stats.allOrbs],
    ['最少步数', stats.parMet],
  ].entries()) {
    const x = 72 + index * 326
    text(String(label), x, 1690, 34)
    text(`${value}/${stats.count}`, x, 1768, 48, 500)
  }
  ctx.fillStyle = palette.journeyFooter
  ctx.fillRect(0, 1860, JOURNEY_WIDTH, 240)
  text('路看似相连，就能走过去。', 72, 1952, 32, 400, palette.plumDeep)
  text('zzugbb.github.io/Seemingly/', 72, 2024, 32, 400, palette.plumDeep)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('无法生成图片'))), 'image/png')
  })
}
