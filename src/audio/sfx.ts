import { audioEngine, type AudioBus } from './engine'
import { music } from './music'
import { chapterSealNotes, midiFrequency, stepNote, successNotes, type Chord } from './theory'
import { feltBuffer, woodBuffer } from './instruments'
import { feedbackFocus, type Sound } from './mix'

export type { Sound } from './mix'
interface SoundOptions {
  open?: boolean
  register?: number
  count?: number
  chapter?: 3 | 4
}
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
  pan?: number,
) {
  const gain = bus.context.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(volume, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration - 0.005)
  gain.gain.linearRampToValueAtTime(0, at + duration)
  source.connect(filter ?? gain)
  filter?.connect(gain)
  const panner = pan === undefined ? undefined : bus.context.createStereoPanner()
  if (panner) panner.pan.value = pan!
  gain.connect(panner ?? bus.output)
  panner?.connect(bus.output)
  bus.schedule(source, at, duration, () => {
    filter?.disconnect()
    gain.disconnect()
    panner?.disconnect()
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

export function renderSound(
  bus: AudioBus,
  sound: Sound,
  options: SoundOptions = {},
  at = bus.context.currentTime,
  harmony: { chord: Chord; scale: readonly number[]; courtyard: boolean } = {
    chord: music.currentChord(),
    scale: music.currentScale(),
    courtyard: music.isCourtyard(),
  },
): void {
  const { chord, scale, courtyard } = harmony
  const root = chord.notes[0]
  if (
    sound === 'orb' ||
    sound === 'optionalOrb' ||
    sound === 'ready' ||
    sound === 'lantern' ||
    sound === 'rating' ||
    sound === 'seal'
  ) {
    const notes =
      sound === 'seal' ? chapterSealNotes(options.chapter === 4 ? 4 : 3) : successNotes(sound, chord, options.count)
    for (const note of notes) {
      if (courtyard) {
        const source = bus.context.createBufferSource()
        source.buffer = feltBuffer(bus.context, note.note)
        voice(bus, source, at + note.at, note.duration, note.velocity, 0.008, undefined, note.pan)
      } else tone(bus, note.note, at + note.at, note.duration, note.velocity * 0.22)
    }
    return
  }
  if (courtyard) {
    const felt = (note: number, time: number, duration: number, volume: number) => {
      const source = bus.context.createBufferSource()
      source.buffer = feltBuffer(bus.context, note)
      voice(bus, source, time, duration, volume, 0.015)
    }
    const grain = (turning: boolean, volume: number) => {
      const source = bus.context.createBufferSource()
      source.buffer = woodBuffer(bus.context, turning)
      voice(bus, source, at, turning ? 0.9 : 0.12, volume, turning ? 0.12 : 0.005)
    }
    if (sound === 'step') {
      grain(false, 0.12)
      return
    }
    if (sound === 'turn') {
      grain(true, 0.22)
      felt(root + 12 + (options.register ?? 0), at + 0.08, 0.45, 0.09)
      return
    }
    if (sound === 'mechanism') {
      felt(root + 12 + (options.register ?? 0), at, 0.65, 0.19)
      return
    }
  }
  if (sound === 'turn') return
  if (sound === 'step') {
    if (previousChord !== chord.name) {
      previousChord = chord.name
      footstep = 0
    }
    tone(bus, stepNote(chord, footstep++), at, 0.13, 0.035, 'triangle')
  } else if (sound === 'mechanism') {
    for (const note of [root - 12, root - 5]) tone(bus, note, at, 0.2, 0.05, 'triangle')
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
export function playSound(sound: Sound, options?: SoundOptions): void {
  const bus = audioEngine.getBus()
  if (!bus) return
  renderSound(bus, sound, options)
  const focus = feedbackFocus(sound)
  if (focus) audioEngine.focusFeedback(focus)
}
