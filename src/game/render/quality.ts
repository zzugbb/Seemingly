export type QualityName = 'high' | 'low'

export interface QualitySettings {
  name: QualityName
  maxDpr: number
  shadows: boolean
  shadowMapSize: number
  sparkleScale: number
  cloudCount: number
}

export function detectQuality(): QualityName {
  if (typeof window === 'undefined') return 'high'
  const param = new URLSearchParams(window.location.search).get('quality')
  if (param === 'low' || param === 'high') return param
  if (window.matchMedia('(pointer: coarse)').matches) return 'low'
  return 'high'
}

export function qualitySettings(name: QualityName): QualitySettings {
  if (name === 'low') {
    return { name, maxDpr: 1.5, shadows: false, shadowMapSize: 0, sparkleScale: 0.5, cloudCount: 1 }
  }
  return { name, maxDpr: 2, shadows: true, shadowMapSize: 2048, sparkleScale: 1, cloudCount: 3 }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
