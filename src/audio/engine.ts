const MASTER_VOLUME = 0.28

export interface AudioBus {
  context: BaseAudioContext
  output: AudioNode
}

const createContext = () => (typeof AudioContext === 'undefined' ? undefined : new AudioContext())

export class AudioEngine {
  private session: { context: AudioContext; output: GainNode } | undefined
  private muted = false

  constructor(private readonly create: () => AudioContext | undefined = createContext) {}

  async unlock(): Promise<void> {
    try {
      if (!this.session || this.session.context.state === 'closed') {
        const context = this.create()
        if (!context) return
        const output = context.createGain()
        output.gain.value = this.muted ? 0 : MASTER_VOLUME
        output.connect(context.destination)
        this.session = { context, output }
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
    const { context, output } = this.session
    output.gain.cancelScheduledValues(context.currentTime)
    if (muted) output.gain.setValueAtTime(0, context.currentTime)
    else output.gain.setTargetAtTime(MASTER_VOLUME, context.currentTime, 0.015)
  }

  getBus(): AudioBus | undefined {
    return !this.muted && this.session?.context.state === 'running' ? this.session : undefined
  }
}

export const audioEngine = new AudioEngine()
