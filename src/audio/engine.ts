import { createReverb } from './reverb'
import {
  MASTER_GAIN,
  MUSIC_GAIN,
  FEEDBACK_GAIN,
  REVERB_SEND,
  FOCUS_ATTACK,
  focusValue,
  nextFocus,
  type FeedbackFocus,
  type MusicFocus,
} from './mix'

const MAX_SOURCES = 12
export interface AudioBus {
  context: BaseAudioContext
  output: GainNode
  cancel: (source: AudioScheduledSourceNode) => void
  schedule: (source: AudioScheduledSourceNode, at: number, duration: number, cleanup: () => void) => boolean
}
type BusName = 'music' | 'sfx'
interface Session {
  context: AudioContext
  master: GainNode
  buses: Record<BusName, AudioBus>
  musicFocus: GainNode
}
const createContext = () => (typeof AudioContext === 'undefined' ? undefined : new AudioContext())

export class AudioEngine {
  private session: Session | undefined
  private muted = false
  private focus: MusicFocus | undefined
  private sources = new Map<AudioScheduledSourceNode, { dispose: () => void; bus: BusName; at: number }>()
  constructor(private readonly create: () => AudioContext | undefined = createContext) {}

  async unlock(): Promise<void> {
    try {
      if (!this.session || this.session.context.state === 'closed') {
        this.stopSources()
        const context = this.create()
        if (!context) return
        const master = context.createGain()
        master.gain.value = this.muted ? 0 : MASTER_GAIN
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -18
        compressor.knee.value = 18
        compressor.ratio.value = 3
        master.connect(compressor)
        compressor.connect(context.destination)
        const reverb = createReverb(context)
        reverb.connect(master)
        const musicFocus = context.createGain()
        this.focus = undefined
        const bus = (name: BusName, volume: number): AudioBus => {
          const output = context.createGain()
          output.gain.value = volume
          const audible = name === 'music' ? musicFocus : output
          if (name === 'music') output.connect(musicFocus)
          audible.connect(master)
          const send = context.createGain()
          send.gain.value = REVERB_SEND
          audible.connect(send)
          send.connect(reverb)
          return {
            context,
            output,
            cancel: (source) => this.cancel(source),
            schedule: (source, at, duration, cleanup) => {
              if (name === 'sfx' && this.sources.size >= MAX_SOURCES) {
                let latest: AudioScheduledSourceNode | undefined
                let latestAt = -Infinity
                for (const [voice, tracked] of this.sources)
                  if (tracked.bus === 'music' && tracked.at > latestAt) {
                    latest = voice
                    latestAt = tracked.at
                  }
                if (latest) this.cancel(latest)
              }
              const musicCount = [...this.sources.values()].filter((source) => source.bus === 'music').length
              if (
                this.muted ||
                this.session?.context !== context ||
                context.state !== 'running' ||
                this.sources.size >= MAX_SOURCES ||
                (name === 'music' && musicCount >= 8)
              ) {
                source.disconnect()
                cleanup()
                return false
              }
              const dispose = () => {
                source.disconnect()
                cleanup()
              }
              this.sources.set(source, { dispose, bus: name, at })
              source.onended = () => {
                if (this.sources.delete(source)) dispose()
              }
              try {
                source.start(at)
                source.stop(at + duration)
              } catch {
                this.sources.delete(source)
                dispose()
                return false
              }
              return true
            },
          }
        }
        this.session = {
          context,
          master,
          musicFocus,
          buses: { music: bus('music', MUSIC_GAIN), sfx: bus('sfx', FEEDBACK_GAIN) },
        }
      }
      if (this.session.context.state !== 'running') await this.session.context.resume()
    } catch {
      // 音频能力和自动播放策略不应阻止游戏；下次真实交互会重试。
    }
  }

  setMuted(muted: boolean): void {
    if (muted === this.muted) return
    this.muted = muted
    if (!this.session) return
    const { context, master } = this.session
    master.gain.cancelScheduledValues(context.currentTime)
    if (muted) {
      master.gain.setValueAtTime(0, context.currentTime)
      this.stopSources()
      this.restoreMusicFocus(0)
    } else master.gain.setTargetAtTime(MASTER_GAIN, context.currentTime, 0.015)
  }
  getBus(name: BusName = 'sfx'): AudioBus | undefined {
    return !this.muted && this.session?.context.state === 'running' ? this.session.buses[name] : undefined
  }
  focusFeedback(profile: FeedbackFocus): void {
    if (!this.session || this.muted || this.session.context.state !== 'running') return
    const at = this.session.context.currentTime
    const gain = this.session.musicFocus.gain
    const focus = nextFocus(this.focus, profile, at, gain.value)
    this.focus = focus
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(focus.from, at)
    gain.linearRampToValueAtTime(focus.target, at + FOCUS_ATTACK)
    gain.setValueAtTime(focus.target, focus.holdUntil)
    gain.linearRampToValueAtTime(1, focus.releaseUntil)
  }
  stopEffects(): void {
    for (const [source, tracked] of this.sources) if (tracked.bus === 'sfx') this.cancel(source)
    this.restoreMusicFocus()
  }
  private restoreMusicFocus(seconds = 0.08): void {
    if (!this.session) return
    const at = this.session.context.currentTime
    const gain = this.session.musicFocus.gain
    const from = this.focus ? focusValue(this.focus, at) : gain.value
    this.focus = undefined
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(from, at)
    gain.linearRampToValueAtTime(1, at + seconds)
  }
  private cancel(source: AudioScheduledSourceNode) {
    const tracked = this.sources.get(source)
    if (!tracked) return
    this.sources.delete(source)
    source.onended = null
    source.stop()
    tracked.dispose()
  }
  private stopSources() {
    for (const source of this.sources.keys()) this.cancel(source)
  }
}
export const audioEngine = new AudioEngine()
