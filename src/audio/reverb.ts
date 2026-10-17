export function createReverb(context: BaseAudioContext): ConvolverNode {
  const seconds = 2.5
  const buffer = context.createBuffer(2, Math.ceil(context.sampleRate * seconds), context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel)
    for (let index = 0; index < samples.length; index++) {
      const time = index / samples.length
      samples[index] = (Math.random() * 2 - 1) * Math.exp(-6 * time) * (1 - time)
    }
  }
  const convolver = context.createConvolver()
  convolver.buffer = buffer
  return convolver
}
