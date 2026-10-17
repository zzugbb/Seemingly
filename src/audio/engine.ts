import { createReverb } from './reverb'

const MASTER_VOLUME = 0.28
const MAX_SOURCES = 12
export interface AudioBus {
  context: AudioContext
  output: GainNode
  cancel: (source: AudioScheduledSourceNode) => void
  schedule: (source: AudioScheduledSourceNode, at: number, duration: number, cleanup: () => void) => boolean
}
type BusName = 'music' | 'sfx'
interface Session {
  context: AudioContext
  master: GainNode
  buses: Record<BusName, AudioBus>
}
const createContext = () => (typeof AudioContext === 'undefined' ? undefined : new AudioContext())

export class AudioEngine {
  private session: Session | undefined
  private muted = false
  private sources = new Map<AudioScheduledSourceNode, () => void>()
  constructor(private readonly create: () => AudioContext | undefined = createContext) {}

  async unlock(): Promise<void> {
    try {
      if (!this.session || this.session.context.state === 'closed') {
        this.stopSources()
        const context = this.create()
        if (!context) return
        const master = context.createGain()
        master.gain.value = this.muted ? 0 : MASTER_VOLUME
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -18
        compressor.knee.value = 18
        compressor.ratio.value = 3
        master.connect(compressor)
        compressor.connect(context.destination)
        const reverb = createReverb(context)
        reverb.connect(master)
        const bus = (volume: number): AudioBus => {
          const output = context.createGain()
          output.gain.value = volume
          output.connect(master)
          const send = context.createGain()
          send.gain.value = 0.35
          output.connect(send)
          send.connect(reverb)
          return {
            context,
            output,
            cancel: (source) => {
              const cleanup = this.sources.get(source)
              if (!cleanup) return
              this.sources.delete(source)
              source.stop()
              cleanup()
            },
            schedule: (source, at, duration, cleanup) => {
              if (
                this.muted ||
                this.session?.context !== context ||
                context.state !== 'running' ||
                this.sources.size >= MAX_SOURCES
              ) {
                source.disconnect()
                cleanup()
                return false
              }
              const dispose = () => {
                source.disconnect()
                cleanup()
              }
              this.sources.set(source, dispose)
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
        this.session = { context, master, buses: { music: bus(0.18), sfx: bus(0.5) } }
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
    } else master.gain.setTargetAtTime(MASTER_VOLUME, context.currentTime, 0.015)
  }
  getBus(name: BusName = 'sfx'): AudioBus | undefined {
    return !this.muted && this.session?.context.state === 'running' ? this.session.buses[name] : undefined
  }
  private stopSources() {
    for (const [source, cleanup] of this.sources) {
      source.stop()
      cleanup()
    }
    this.sources.clear()
  }
}
export const audioEngine = new AudioEngine()
