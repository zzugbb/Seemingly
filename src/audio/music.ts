import { audioEngine, type AudioBus } from './engine'
import {
  chapterScale,
  chordAt,
  chordDuration,
  courtyardNote,
  courtyardChordAt,
  COURTYARD_CHORD_SECONDS,
  COURTYARD_SECONDS,
  COURTYARD_NOTE_COUNT,
  COURTYARD_GAIN,
  midiFrequency,
  type Chapter,
  type Chord,
  type Soundtrack,
} from './theory'
import { feltBuffer, silkBuffer } from './instruments'

interface Layer {
  chapter: Chapter
  challenge: boolean
  soundtrack: Soundtrack
  nextNote: number
  epoch: number
  nextChord: number
  nextBox: number
  gain: GainNode
  sources: Set<AudioScheduledSourceNode>
}
const pads = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>()
function padBuffer(context: BaseAudioContext, chord: Chord): AudioBuffer {
  let cache = pads.get(context)
  if (!cache) {
    cache = new Map()
    pads.set(context, cache)
  }
  const key = chord.notes.join(',')
  const previous = cache.get(key)
  if (previous) return previous
  const seconds = 8
  const buffer = context.createBuffer(1, seconds * context.sampleRate, context.sampleRate)
  const samples = buffer.getChannelData(0)
  // 整数周期保证循环接缝连续；每个音含两个轻微失谐的三角波，整组共用一个音源。
  const frequencies = chord.notes.flatMap((note) => {
    const center = Math.round(midiFrequency(note) * seconds) / seconds
    return [center - 0.25, center + 0.25]
  })
  for (const frequency of frequencies) {
    for (let index = 0; index < samples.length; index++) {
      const phase = ((index / context.sampleRate) * frequency) % 1
      samples[index] += (1 - 4 * Math.abs(phase - 0.5)) / frequencies.length
    }
  }
  cache.set(key, buffer)
  if (cache.size > 8) cache.delete(cache.keys().next().value!)
  return buffer
}

export class MusicPlayer {
  private bus: AudioBus | undefined
  private layer: Layer | undefined
  private retiring: Layer | undefined
  private timer: ReturnType<typeof setInterval> | undefined
  private chapter: Chapter = 1
  private challenge = false
  private soundtrack: Soundtrack = 'generative'
  private paused = 0

  start(chapter: Chapter = this.chapter, challenge = this.challenge, soundtrack = this.soundtrack): void {
    const bus = audioEngine.getBus('music')
    if (!bus) {
      this.setChapter(chapter, challenge, soundtrack)
      return
    }
    if (this.bus?.context === bus.context && this.layer) {
      this.setChapter(chapter, challenge, soundtrack)
      return
    }
    this.stop()
    this.setChapter(chapter, challenge, soundtrack)
    this.bus = bus
    this.layer = this.createLayer(chapter, challenge, this.paused)
    this.tick()
    this.timer = setInterval(() => this.tick(), 100)
  }
  setChapter(chapter: Chapter, challenge = false, soundtrack: Soundtrack = 'generative'): void {
    if (this.chapter === chapter && this.challenge === challenge && this.soundtrack === soundtrack) return
    this.chapter = chapter
    this.challenge = challenge
    this.soundtrack = soundtrack
    this.paused = 0
    if (!this.bus || !this.layer) return
    if (this.retiring) this.disposeLayer(this.retiring)
    const at = this.bus.context.currentTime
    this.retiring = this.layer
    const old = this.retiring
    old.gain.gain.cancelScheduledValues(at)
    old.gain.gain.setValueAtTime(old.gain.gain.value, at)
    old.gain.gain.linearRampToValueAtTime(0, at + 3)
    for (const source of old.sources) source.stop(at + 3)
    this.layer = this.createLayer(chapter, challenge, 0)
    this.tick()
  }
  stop(): void {
    if (this.layer && this.bus) this.paused = Math.max(0, this.bus.context.currentTime - this.layer.epoch)
    if (this.timer !== undefined) clearInterval(this.timer)
    this.timer = undefined
    if (this.layer) this.disposeLayer(this.layer)
    if (this.retiring) this.disposeLayer(this.retiring)
    this.layer = undefined
    this.retiring = undefined
    this.bus = undefined
  }
  currentChord(): Chord {
    return this.isCourtyard() ? courtyardChordAt(this.elapsed()) : chordAt(this.chapter, this.elapsed(), this.challenge)
  }
  isCourtyard(): boolean {
    return this.soundtrack === 'courtyard'
  }
  currentScale(): readonly number[] {
    return chapterScale(this.chapter)
  }
  private elapsed(): number {
    return this.bus && this.layer ? Math.max(0, this.bus.context.currentTime - this.layer.epoch) : this.paused
  }
  private createLayer(chapter: Chapter, challenge: boolean, elapsed: number): Layer {
    const context = this.bus!.context,
      at = context.currentTime
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(this.isCourtyard() ? COURTYARD_GAIN : 1, at + 3)
    gain.connect(this.bus!.output)
    return {
      chapter,
      challenge,
      soundtrack: this.soundtrack,
      nextNote: Math.floor(elapsed / COURTYARD_SECONDS) * COURTYARD_NOTE_COUNT,
      epoch: at - elapsed,
      nextChord: at + 0.01,
      nextBox: at + 1.5,
      gain,
      sources: new Set(),
    }
  }
  private disposeLayer(layer: Layer) {
    for (const source of layer.sources) this.bus?.cancel(source)
    layer.sources.clear()
    layer.gain.disconnect()
  }
  private schedule(
    layer: Layer,
    source: AudioScheduledSourceNode,
    nodes: AudioNode[],
    at: number,
    duration: number,
  ): void {
    source.connect(nodes[0])
    nodes.forEach((node, index) => node.connect(nodes[index + 1] ?? layer.gain))
    layer.sources.add(source)
    this.bus!.schedule(source, at, duration, () => {
      layer.sources.delete(source)
      nodes.forEach((node) => node.disconnect())
      if (layer !== this.layer && layer.sources.size === 0) layer.gain.disconnect()
    })
  }
  private tick(): void {
    if (!this.bus || !this.layer) return
    const { context } = this.bus,
      layer = this.layer,
      now = context.currentTime
    if (context.state !== 'running') return
    if (layer.nextChord < now) layer.nextChord = now + 0.01
    if (layer.nextBox < now) layer.nextBox = now + 0.01
    const horizon = now + 0.3
    while (layer.nextChord < horizon) {
      const at = layer.nextChord,
        elapsed = Math.max(0, at - layer.epoch),
        duration = layer.soundtrack === 'courtyard' ? COURTYARD_CHORD_SECONDS : chordDuration(layer.challenge)
      const index = Math.floor((elapsed + 0.000001) / duration)
      const remaining = Math.max(0.001, layer.epoch + (index + 1) * duration - at)
      const courtyard = layer.soundtrack === 'courtyard'
      const chord = courtyard
        ? courtyardChordAt(elapsed + 0.000001)
        : chordAt(layer.chapter, elapsed + 0.000001, layer.challenge)
      const pad = context.createBufferSource()
      pad.buffer = courtyard ? silkBuffer(context, chord) : padBuffer(context, chord)
      pad.loop = true
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 900
      const envelope = context.createGain()
      const padVolume = courtyard ? 0.32 : 0.5
      const release = courtyard ? 5 : 3
      envelope.gain.setValueAtTime(0, at)
      envelope.gain.linearRampToValueAtTime(padVolume, at + Math.min(courtyard ? 4 : 2, remaining))
      envelope.gain.setValueAtTime(padVolume, at + remaining)
      envelope.gain.linearRampToValueAtTime(0, at + remaining + release)
      this.schedule(layer, pad, [filter, envelope], at, remaining + release)
      layer.nextChord = at + remaining
      if (courtyard) continue
      const bass = context.createOscillator()
      bass.type = 'sine'
      bass.frequency.value = midiFrequency(chord.notes[0] - 12)
      const bassGain = context.createGain()
      const bassVolume = 0.3
      bassGain.gain.setValueAtTime(0, at)
      bassGain.gain.linearRampToValueAtTime(bassVolume, at + Math.min(1, remaining))
      bassGain.gain.setValueAtTime(bassVolume, at + remaining)
      bassGain.gain.linearRampToValueAtTime(0, at + remaining + 3)
      this.schedule(layer, bass, [bassGain], at, remaining + 3)
      layer.nextChord = at + remaining
    }
    if (layer.soundtrack === 'courtyard') {
      layer.nextNote = Math.max(
        layer.nextNote,
        Math.floor((now - layer.epoch) / COURTYARD_SECONDS) * COURTYARD_NOTE_COUNT,
      )
      for (;;) {
        const note = courtyardNote(layer.nextNote)
        const at = layer.epoch + note.at
        if (at >= horizon) break
        layer.nextNote++
        if (at < now) continue
        const tone = context.createBufferSource()
        tone.buffer = feltBuffer(context, note.note)
        const pan = context.createStereoPanner()
        pan.pan.value = note.pan
        const envelope = context.createGain()
        envelope.gain.setValueAtTime(0, at)
        envelope.gain.linearRampToValueAtTime(0.3 * note.velocity, at + 0.02)
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.duration)
        this.schedule(layer, tone, [envelope, pan], at, note.duration + 0.01)
      }
    } else
      while (layer.nextBox < horizon) {
        const at = layer.nextBox,
          scale = chapterScale(layer.chapter)
        const tone = context.createOscillator()
        tone.type = 'sine'
        tone.frequency.value = midiFrequency(scale[Math.floor(Math.random() * scale.length)] + 12)
        const envelope = context.createGain()
        envelope.gain.setValueAtTime(0, at)
        envelope.gain.linearRampToValueAtTime(0.25, at + 0.008)
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 1.2)
        this.schedule(layer, tone, [envelope], at, 1.21)
        const pace = [1, 0.94, 0.88, 0.82, 0.92][layer.chapter - 1]
        layer.nextBox += (1.5 + Math.random() * 2.5 * pace) / (layer.challenge ? 0.9 : 1)
      }
  }
}
export const music = new MusicPlayer()
