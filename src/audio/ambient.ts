import type { AudioBus } from './engine'

const CHORD = [130.81, 164.81, 196]
const VOLUME = 0.085
const BREATH_DEPTH = 0.015
const BREATH_FREQUENCY = 0.12

export class Ambient {
  private session: { bus: AudioBus; sources: OscillatorNode[]; gains: GainNode[] } | undefined

  sync(bus: AudioBus | undefined): void {
    if (bus && this.session?.bus.context === bus.context && this.session.bus.output === bus.output) return
    this.stop()
    if (!bus) return
    const { context, output } = bus
    const at = context.currentTime
    const mix = context.createGain()
    mix.gain.value = 1 / CHORD.length
    const volume = context.createGain()
    volume.gain.value = VOLUME
    const fade = context.createGain()
    fade.gain.setValueAtTime(0, at)
    fade.gain.linearRampToValueAtTime(1, at + 0.8)
    mix.connect(volume)
    volume.connect(fade)
    fade.connect(output)

    const tones = CHORD.map((frequency) => {
      const tone = context.createOscillator()
      tone.type = 'sine'
      tone.frequency.value = frequency
      tone.connect(mix)
      return tone
    })
    const breath = context.createOscillator()
    breath.type = 'sine'
    breath.frequency.value = BREATH_FREQUENCY
    const depth = context.createGain()
    depth.gain.value = BREATH_DEPTH
    breath.connect(depth)
    depth.connect(volume.gain)
    const sources = [...tones, breath]
    for (const source of sources) source.start(at)
    this.session = { bus, sources, gains: [mix, volume, fade, depth] }
  }

  stop(): void {
    if (!this.session) return
    const { bus, sources, gains } = this.session
    for (const source of sources) {
      source.stop(bus.context.currentTime)
      source.disconnect()
    }
    for (const gain of gains) gain.disconnect()
    this.session = undefined
  }
}

export const ambient = new Ambient()
