import type { Axis, ColorName, MechBlockDef, MoverDef, PlateDef, RotatorDef, Vec3 } from '../levels/types'
import { addVec, rotateOffset } from './iso'

export interface MechBlock {
  id: string
  pos: Vec3
  kind: 'path' | 'solid'
  color: ColorName
}

const normalize = (value: number) => value + 0

const place = (id: string, index: number, pos: Vec3, block: MechBlockDef): MechBlock => ({
  id: `${id}#${index}`,
  pos: [normalize(pos[0]), normalize(pos[1]), normalize(pos[2])],
  kind: block.kind ?? 'path',
  color: block.color ?? 'tealLight',
})

export function rotatorBlocks(rotator: RotatorDef, step: number): MechBlock[] {
  return rotator.blocks.map((block, index) =>
    place(rotator.id, index, addVec(rotator.pivot, rotateOffset(block.offset, step)), block),
  )
}

const axisShift = (axis: Axis, amount: number): Vec3 =>
  axis === 'x' ? [amount, 0, 0] : axis === 'y' ? [0, amount, 0] : [0, 0, amount]

export function moverBlocks(mover: MoverDef, stopIndex: number): MechBlock[] {
  const shift = axisShift(mover.axis, mover.stops[stopIndex] ?? 0)
  return mover.blocks.map((block, index) =>
    place(mover.id, index, addVec(addVec(mover.origin, block.offset), shift), block),
  )
}

export interface MoverCursor {
  stopIndex: number
  direction: 1 | -1
}

export const moverCursor = (mover: MoverDef): MoverCursor => ({
  stopIndex: mover.initialStop ?? 0,
  direction: 1,
})

export function advanceMover(mover: MoverDef, cursor: MoverCursor): MoverCursor {
  const last = mover.stops.length - 1
  if (last <= 0) return cursor
  let direction = cursor.direction
  if (cursor.stopIndex === last && direction === 1) direction = -1
  else if (cursor.stopIndex === 0 && direction === -1) direction = 1
  return { stopIndex: cursor.stopIndex + direction, direction }
}

const sameVec = (a: Vec3, b: Vec3) => a[0] + 0 === b[0] + 0 && a[1] + 0 === b[1] + 0 && a[2] + 0 === b[2] + 0

export interface PlateVerdict {
  trigger: boolean
  spent: boolean
}

export function judgePlate(input: {
  plate: PlateDef
  at: Vec3
  stopped: boolean
  spent: boolean
  targetBusy: boolean
  standingOnTarget: boolean
}): PlateVerdict {
  const usedUp = input.plate.once === true && input.spent
  const ready =
    input.stopped && sameVec(input.at, input.plate.tile) && !usedUp && !input.targetBusy && !input.standingOnTarget
  const spent = input.plate.once === true ? input.spent || ready : false
  return { trigger: ready, spent }
}
