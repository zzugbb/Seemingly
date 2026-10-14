import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3, type OrthographicCamera } from 'three'
import { moverBlocks, rotatorBlocks } from '../core/mechanisms'
import type { LevelDef } from '../levels/types'

export function CameraRig({ level }: { level: LevelDef }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera
  const size = useThree((s) => s.size)

  const bounds = useMemo(() => {
    const right = new Vector3(1, 0, -1).normalize()
    const up = new Vector3(-1, 2, -1).normalize()
    const points: Vector3[] = []
    for (const block of level.blocks) points.push(new Vector3(...block.pos))
    for (const mechanism of level.mechanisms) {
      if (mechanism.type === 'rotator') {
        for (let step = 0; step < 4; step++) {
          for (const block of rotatorBlocks(mechanism, step)) points.push(new Vector3(...block.pos))
        }
      } else if (mechanism.type === 'mover') {
        for (let stop = 0; stop < mechanism.stops.length; stop++) {
          for (const block of moverBlocks(mechanism, stop)) points.push(new Vector3(...block.pos))
        }
      }
    }
    for (const island of level.decor.islands) {
      const cx = (island.x[0] + island.x[1]) / 2
      const cz = (island.z[0] + island.z[1]) / 2
      points.push(new Vector3(cx, island.y - 0.5 - island.depth, cz))
    }
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const point of points) {
      const sx = point.dot(right)
      const sy = point.dot(up)
      minX = Math.min(minX, sx - 0.9)
      maxX = Math.max(maxX, sx + 0.9)
      minY = Math.min(minY, sy - 0.9)
      maxY = Math.max(maxY, sy + 1.2)
    }
    const center = right
      .clone()
      .multiplyScalar((minX + maxX) / 2)
      .add(up.clone().multiplyScalar((minY + maxY) / 2))
    return { center, width: maxX - minX, height: maxY - minY }
  }, [level])

  useEffect(() => {
    const { center, width, height } = bounds
    camera.position.copy(center).add(new Vector3(30, 30, 30))
    camera.up.set(0, 1, 0)
    camera.lookAt(center)
    camera.zoom = Math.min(size.width / (width * 1.15), size.height / (height * 1.2))
    camera.near = 0.1
    camera.far = 200
    camera.updateProjectionMatrix()
  }, [bounds, camera, size])

  return null
}
