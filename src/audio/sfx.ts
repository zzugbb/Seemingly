import { audioEngine, type AudioBus } from './engine'
import { music } from './music'
import { midiFrequency, stepNote } from './theory'

export type Sound =
  'step' | 'mechanism' | 'orb' | 'lantern' | 'unreachable' | 'undo' | 'goalLocked' | 'push' | 'gate' | 'patrol'
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()
let previousChord = ''
let footstep = 0

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
  bus.schedule(source, at, duration, () => {
    filter?.disconnect()
    gain.disconnect()
  })
}
function tone(
  bus: AudioBus,
  note: number,
  at: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  slide?: number,
) {
  const source = bus.context.createOscillator()
  source.type = type
  source.frequency.setValueAtTime(midiFrequency(note), at)
  if (slide !== undefined) source.frequency.exponentialRampToValueAtTime(midiFrequency(slide), at + duration)
  const filter = bus.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = type === 'triangle' ? 1200 : 3500
  voice(bus, source, at, duration, volume, 0.008, filter)
}
function friction(bus: AudioBus, at: number) {
  let buffer = noiseBuffers.get(bus.context)
  if (!buffer) {
    buffer = bus.context.createBuffer(1, Math.ceil(bus.context.sampleRate * 0.18), bus.context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1
    noiseBuffers.set(bus.context, buffer)
  }
  const source = bus.context.createBufferSource()
  source.buffer = buffer
  const filter = bus.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 450
  voice(bus, source, at, 0.16, 0.055, 0.015, filter)
}

export function renderSound(bus: AudioBus, sound: Sound, options: { open?: boolean } = {}): void {
  const at = bus.context.currentTime,
    chord = music.currentChord(),
    scale = music.currentScale(),
    root = chord.notes[0]
  if (sound === 'step') {
    if (previousChord !== chord.name) {
      previousChord = chord.name
      footstep = 0
    }
    tone(bus, stepNote(chord, footstep++), at, 0.13, 0.035, 'triangle')
  } else if (sound === 'mechanism') {
    for (const note of [root - 12, root - 5]) tone(bus, note, at, 0.2, 0.05, 'triangle')
  } else if (sound === 'orb') {
    const index = Math.floor(Math.random() * (scale.length - 1))
    for (let i = 0; i < 2; i++) tone(bus, scale[index + i] + 12, at + i * 0.08, 0.35, 0.075)
  } else if (sound === 'lantern') {
    chord.notes.forEach((note, i) => tone(bus, note + 12, at + i * 0.12, 0.6, 0.09))
  } else if (sound === 'unreachable' || sound === 'goalLocked') {
    tone(bus, scale[1] - 24, at, 0.32, 0.065)
    if (sound === 'goalLocked') tone(bus, scale[1] - 12, at + 0.12, 0.25, 0.035)
  } else if (sound === 'undo') tone(bus, root + 12, at, 0.24, 0.055, 'sine', root)
  else if (sound === 'push') {
    friction(bus, at)
    tone(bus, root - 12, at, 0.18, 0.06, 'triangle')
  } else if (sound === 'gate') {
    const notes = options.open === false ? [root + 7, root] : [root, root + 7]
    notes.forEach((note, index) => tone(bus, note, at + index * 0.1, 0.22, 0.055, 'triangle'))
  } else tone(bus, scale[scale.length - 1] + 12, at, 0.1, 0.012)
}
export function playSound(sound: Sound, options?: { open?: boolean }): void {
  const bus = audioEngine.getBus()
  if (bus) renderSound(bus, sound, options)
}
