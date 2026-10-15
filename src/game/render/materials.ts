import { MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { SLAB_HEIGHT } from '../core/iso'
import { palette } from './palette'

export const blockGeometry = new RoundedBoxGeometry(0.98, 0.98, 0.98, 3, 0.07)
export const slabGeometry = new RoundedBoxGeometry(0.84, SLAB_HEIGHT * 2, 0.84, 2, 0.03)

const cache = new Map<string, MeshStandardMaterial>()

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
