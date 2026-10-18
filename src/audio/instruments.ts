import { midiFrequency, type Chord } from './theory'

const felt = new WeakMap<BaseAudioContext, Map<number, AudioBuffer>>()
const silk = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>()
const wood = new WeakMap<BaseAudioContext, Map<boolean, AudioBuffer>>()

export function feltBuffer(context: BaseAudioContext, note: number): AudioBuffer {
  let cache = felt.get(context)
  if (!cache) felt.set(context, (cache = new Map()))
  const previous = cache.get(note)
  if (previous) return previous
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 6), context.sampleRate)
  const samples = buffer.getChannelData(0)
  const frequency = midiFrequency(note)
  const modes = [
    [1, 1, 0.7],
    [2.002, 0.28, 1.5],
    [3.006, 0.12, 2.2],
    [4.012, 0.055, 3.2],
    [5.02, 0.025, 4],
  ]
  for (const [ratio, gain, decay] of modes) {
    for (let i = 0; i < samples.length; i++) {
      const time = i / context.sampleRate
      samples[i] +=
        Math.sin(2 * Math.PI * frequency * ratio * time) *
        gain *
        Math.exp(-decay * time) *
        (1 - Math.exp(-120 * time)) *
        0.42
    }
  }
  cache.set(note, buffer)
  if (cache.size > 12) cache.delete(cache.keys().next().value!)
  return buffer
}

export function silkBuffer(context: BaseAudioContext, chord: Chord): AudioBuffer {
  let cache = silk.get(context)
  if (!cache) silk.set(context, (cache = new Map()))
  const key = chord.notes.join(',')
  const previous = cache.get(key)
  if (previous) return previous
  const seconds = 8
  const buffer = context.createBuffer(1, seconds * context.sampleRate, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (const note of chord.notes) {
    const center = Math.round(midiFrequency(note) * seconds) / seconds
    for (const frequency of [center - 0.125, center + 0.125]) {
      for (let i = 0; i < samples.length; i++) {
        const phase = (2 * Math.PI * frequency * i) / context.sampleRate
        samples[i] +=
          (Math.sin(phase) + Math.sin(phase * 2) * 0.12 + Math.sin(phase * 3) * 0.025) / (chord.notes.length * 2.3)
      }
    }
  }
  cache.set(key, buffer)
  if (cache.size > 8) cache.delete(cache.keys().next().value!)
  return buffer
}

export function woodBuffer(context: BaseAudioContext, turning = false): AudioBuffer {
  let cache = wood.get(context)
  if (!cache) wood.set(context, (cache = new Map()))
  const previous = cache.get(turning)
  if (previous) return previous
  const seconds = turning ? 0.9 : 0.12
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate)
  const samples = buffer.getChannelData(0)
  let seed = 23117,
    smooth = 0
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    smooth = smooth * 0.92 + ((seed >>> 0) / 2147483648 - 1) * 0.08
    const time = i / context.sampleRate
    samples[i] = turning
      ? smooth * Math.sin((Math.PI * time) / seconds) ** 1.5 * (0.75 + 0.25 * Math.sin(time * 67))
      : (smooth * 0.6 + Math.sin(time * Math.PI * 290) * 0.16) * Math.exp(-time * 50) * (1 - Math.exp(-time * 600))
  }
  cache.set(turning, buffer)
  return buffer
}
