import { noteForY } from './model'

export class AmbientSynth {
  private context: AudioContext | null = null
  private ambience: { input: GainNode; output: GainNode; delay: DelayNode; feedback: GainNode } | null = null

  private getContext() {
    if (!this.context) this.context = new AudioContext()
    return this.context
  }

  private getAmbience(context: AudioContext) {
    if (this.ambience) return this.ambience
    const input = context.createGain()
    const output = context.createGain()
    const delay = context.createDelay(2.5)
    const feedback = context.createGain()
    const filter = context.createBiquadFilter()
    input.gain.value = 0.34
    delay.delayTime.value = 0.42
    feedback.gain.value = 0.24
    filter.type = 'lowpass'
    filter.frequency.value = 1900
    input.connect(delay)
    delay.connect(filter)
    filter.connect(output)
    delay.connect(feedback)
    feedback.connect(delay)
    output.connect(context.destination)
    this.ambience = { input, output, delay, feedback }
    return this.ambience
  }

  async resume() {
    const context = this.getContext()
    if (context.state === 'suspended') await context.resume()
  }

  play(y: number) {
    const context = this.getContext()
    const now = context.currentTime
    const frequency = 440 * Math.pow(2, (noteForY(y) - 69) / 12)
    const output = context.createGain()
    const ambience = this.getAmbience(context)
    const filter = context.createBiquadFilter()
    const fundamental = context.createOscillator()
    const overtone = context.createOscillator()
    fundamental.type = 'sine'
    overtone.type = 'triangle'
    fundamental.frequency.value = frequency
    overtone.frequency.value = frequency * 2
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1700, now)
    filter.Q.value = 0.5
    output.gain.setValueAtTime(0.0001, now)
    output.gain.linearRampToValueAtTime(0.11, now + 0.12)
    output.gain.setValueAtTime(0.085, now + 1.05)
    output.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)
    fundamental.connect(filter)
    overtone.connect(filter)
    filter.connect(output)
    output.connect(context.destination)
    output.connect(ambience.input)
    fundamental.start(now)
    overtone.start(now)
    fundamental.stop(now + 2.45)
    overtone.stop(now + 2.45)
  }
}
