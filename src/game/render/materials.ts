import { MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { SLAB_HEIGHT } from '../core/iso'

export const blockGeometry = new RoundedBoxGeometry(0.98, 0.98, 0.98, 3, 0.07)
export const slabGeometry = new RoundedBoxGeometry(0.84, SLAB_HEIGHT * 2, 0.84, 2, 0.03)

const cache = new Map<string, MeshStandardMaterial>()

export function material(color: string, options: { flat?: boolean } = {}) {
  const key = `${color}:${options.flat ? 'flat' : 'smooth'}`
  let mat = cache.get(key)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, flatShading: options.flat ?? false })
    cache.set(key, mat)
  }
  return mat
}
