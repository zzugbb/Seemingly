import { audioEngine, type AudioBus } from './engine'

export type Sound = 'step' | 'mechanism' | 'unreachable' | 'lantern'

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

function noise(context: BaseAudioContext) {
  let buffer = noiseBuffers.get(context)
  if (!buffer) {
    buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.15), context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
    noiseBuffers.set(context, buffer)
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}

function voice(
  bus: AudioBus,
  source: AudioScheduledSourceNode,
  at: number,
  duration: number,
  volume: number,
  attack: number,
  filter?: BiquadFilterNode,
) {
  const gain = bus.context.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(volume, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration - 0.005)
  gain.gain.linearRampToValueAtTime(0, at + duration)
  source.connect(filter ?? gain)
  filter?.connect(gain)
  gain.connect(bus.output)
  source.onended = () => {
    source.disconnect()
    filter?.disconnect()
    gain.disconnect()
  }
  source.start(at)
  source.stop(at + duration)
}

function softNoise(bus: AudioBus, at: number, duration: number, volume: number, cutoff: number) {
  const filter = bus.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  filter.Q.value = 0.5
  voice(bus, noise(bus.context), at, duration, volume, 0.003, filter)
}

export function renderSound(bus: AudioBus, sound: Sound): void {
  const { context } = bus
  const at = context.currentTime
  if (sound === 'step') {
    softNoise(bus, at, 0.035, 0.065, 850)
  } else if (sound === 'mechanism') {
    const body = context.createOscillator()
    body.type = 'triangle'
    body.frequency.setValueAtTime(160, at)
    body.frequency.exponentialRampToValueAtTime(65, at + 0.12)
    voice(bus, body, at, 0.14, 0.075, 0.004)
    softNoise(bus, at, 0.045, 0.045, 600)
  } else if (sound === 'unreachable') {
    const tone = context.createOscillator()
    tone.type = 'sine'
    tone.frequency.setValueAtTime(440, at)
    tone.frequency.exponentialRampToValueAtTime(220, at + 0.24)
    voice(bus, tone, at, 0.3, 0.09, 0.015)
  } else {
    for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
      const tone = context.createOscillator()
      tone.type = 'sine'
      tone.frequency.value = frequency
      voice(bus, tone, at + index * 0.12, 0.36, 0.12, 0.008)
    }
  }
}

export function playSound(sound: Sound): void {
  const bus = audioEngine.getBus()
  if (bus) renderSound(bus, sound)
}
