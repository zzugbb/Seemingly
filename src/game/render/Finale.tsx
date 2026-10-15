import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { EndingDef } from '../levels/types'
import { endingProgress } from './ending'
import { Lantern } from './Lantern'
import { palette } from './palette'

export function Finale({
  ending,
  sparkleScale,
  reducedMotion,
  onTowerLit,
  onReady,
}: {
  ending: EndingDef
  sparkleScale: number
  reducedMotion: boolean
  onTowerLit: () => void
  onReady: () => void
}) {
  const elapsed = useRef(0)
  const progress = useRef(endingProgress(0, ending.lanterns.length))
  const [litCount, setLitCount] = useState(1)
  const [towerLit, setTowerLit] = useState(false)
  useFrame((_, delta) => {
    if (progress.current.finished) return
    elapsed.current += Math.min(delta, 1 / 30)
    const next = endingProgress(elapsed.current, ending.lanterns.length)
    if (next.litCount !== progress.current.litCount) setLitCount(next.litCount)
    if (next.towerLit && !progress.current.towerLit) {
      setTowerLit(true)
      onTowerLit()
    }
    if (next.finished && !progress.current.finished) onReady()
    progress.current = next
  })
  return (
    <group>
      {ending.lanterns.slice(1).map((pos, index) => (
        <Lantern
          key={pos.join(',')}
          goal={pos}
          reached={index + 1 < litCount}
          sparkleScale={sparkleScale}
          reducedMotion={reducedMotion}
        />
      ))}
      {ending.tower.map((pos) => (
        <pointLight
          key={pos.join(',')}
          position={[pos[0] + 0.7, pos[1] + 0.4, pos[2] + 0.7]}
          color={palette.glow}
          intensity={towerLit ? 1.5 : 0}
          distance={3}
          decay={2}
        />
      ))}
    </group>
  )
}
