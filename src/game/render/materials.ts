import { useEffect, useMemo } from 'react'
import {
  AlwaysStencilFunc,
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  EqualStencilFunc,
  GreaterDepth,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  ReplaceStencilOp,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { SLAB_HEIGHT } from '../core/iso'
import { BLOCK_SIZE, BLOCK_RADIUS, SLAB_WIDTH, SLAB_RADIUS } from '../core/shapes'
import { palette } from './palette'

export const blockGeometry = new RoundedBoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, 3, BLOCK_RADIUS)
export const slabGeometry = new RoundedBoxGeometry(SLAB_WIDTH, SLAB_HEIGHT * 2, SLAB_WIDTH, 2, SLAB_RADIUS)
export const orbGeometry = new SphereGeometry(0.09, 16, 12)
export const orbRingGeometry = new TorusGeometry(0.16, 0.012, 6, 32)
export const orbSparkGeometry = new SphereGeometry(0.018, 6, 4)
export const crateGeometry = new RoundedBoxGeometry(0.72, 0.72, 0.72, 3, 0.06)
export const crateCornerGeometry = new RoundedBoxGeometry(0.1, 0.08, 0.1, 1, 0.015)
export const gatePostGeometry = new BoxGeometry(0.07, 0.55, 0.07)
export const gateBarGeometry = new RoundedBoxGeometry(0.68, 0.13, 0.08, 2, 0.025)
export const gateDotGeometry = new SphereGeometry(0.04, 10, 8)
export const handleDotGeometry = new SphereGeometry(0.03, 8, 6)
export const arrowBarGeometry = new BoxGeometry(0.035, 0.012, 0.25)
export const plateBarGeometry = new BoxGeometry(0.72, 0.02, 0.05)
export const plateInnerBarGeometry = new BoxGeometry(0.5, 0.02, 0.035)
export const plateInnerGeometry = new RoundedBoxGeometry(0.42, 0.06, 0.42, 2, 0.02)
export const handleRingGeometry = new TorusGeometry(0.3, 0.055, 12, 32)
export const handleSpokeGeometry = new BoxGeometry(0.6, 0.06, 0.05)
export const handleHubGeometry = new CylinderGeometry(0.09, 0.09, 0.12, 16)
export const handleKnobGeometry = new SphereGeometry(0.07, 12, 10)
export const handleHitGeometry = new CircleGeometry(0.42, 20)
export const leverBaseGeometry = new CylinderGeometry(0.08, 0.08, 0.06, 12)
export const leverBarGeometry = new BoxGeometry(0.06, 0.4, 0.06)
export const rotatorBaseGeometry = new CylinderGeometry(1.18, 1.18, 0.07, 48)
export const rotatorRimGeometry = new TorusGeometry(1.18, 0.035, 8, 64)
export const markerGeometry = new RingGeometry(0.28, 0.38, 32)
export const lanternPostGeometry = new CylinderGeometry(0.035, 0.04, 0.5, 10)
export const lanternCapGeometry = new RoundedBoxGeometry(0.22, 0.045, 0.22, 2, 0.02)
export const lanternRibGeometry = new RoundedBoxGeometry(0.035, 0.21, 0.035, 1, 0.01)
export const lanternCoreGeometry = new RoundedBoxGeometry(0.13, 0.17, 0.13, 3, 0.04)
export const lanternSparkGeometry = new SphereGeometry(0.028, 8, 6)
export const characterShadowGeometry = new CircleGeometry(0.28, 24)
export const characterBodyGeometry = new CylinderGeometry(0.12, 0.24, 0.48, 20)
export const characterHeadGeometry = new SphereGeometry(0.16, 24, 16)
export const characterEyeGeometry = new SphereGeometry(0.025, 12, 8)
export const characterHatGeometry = new ConeGeometry(0.17, 0.34, 20)
export const hitMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

// 只画被场景挡住的片段；模板位排除角色自身遮挡，避免剪影盖住可见的脸和衣服。
export const characterOcclusionMaterial = new MeshBasicMaterial({
  color: palette.cream,
  transparent: true,
  opacity: 0.7,
  depthFunc: GreaterDepth,
  depthWrite: false,
  stencilWrite: true,
  stencilRef: 0,
  stencilFunc: EqualStencilFunc,
  stencilFuncMask: 1,
  stencilWriteMask: 0,
})

const cache = new Map<string, MeshStandardMaterial>()
const characterCache = new Map<string, MeshStandardMaterial>()

export function characterMaterial(color: string) {
  let mat = characterCache.get(color)
  if (!mat) {
    mat = material(color).clone()
    mat.stencilWrite = true
    mat.stencilRef = 1
    mat.stencilFunc = AlwaysStencilFunc
    mat.stencilFuncMask = 1
    mat.stencilWriteMask = 1
    mat.stencilZPass = ReplaceStencilOp
    characterCache.set(color, mat)
  }
  return mat
}

export function material(color: string, options: { flat?: boolean; opacity?: number; glow?: boolean } = {}) {
  const opacity = options.opacity ?? 1
  const key = `${color}:${options.flat ? 'flat' : 'smooth'}:${opacity}:${options.glow ? 'glow' : 'unlit'}`
  let mat = cache.get(key)
  if (!mat) {
    mat = new MeshStandardMaterial({
      color,
      roughness: 0.88,
      metalness: 0,
      flatShading: options.flat ?? false,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
      ...(options.glow ? { emissive: palette.glow, emissiveIntensity: 0.6 } : {}),
    })
    cache.set(key, mat)
  }
  return mat
}

export function useAnimatedMaterial(color: string, opacity = 1, glow = false) {
  const mat = useMemo(() => material(color, { opacity, glow }).clone(), [color, opacity, glow])
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}
