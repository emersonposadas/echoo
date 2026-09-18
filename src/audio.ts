import { noteForY } from './model'

export class PianoSynth {
  private context: AudioContext | null = null

  private getContext() {
    if (!this.context) this.context = new AudioContext()
    return this.context
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
    const filter = context.createBiquadFilter()
    const fundamental = context.createOscillator()
    const overtone = context.createOscillator()
    fundamental.type = 'triangle'
    overtone.type = 'sine'
    fundamental.frequency.value = frequency
    overtone.frequency.value = frequency * 2
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2400, now)
    output.gain.setValueAtTime(0.0001, now)
    output.gain.exponentialRampToValueAtTime(0.18, now + 0.012)
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    fundamental.connect(filter)
    overtone.connect(filter)
    filter.connect(output)
    output.connect(context.destination)
    fundamental.start(now)
    overtone.start(now)
    fundamental.stop(now + 0.92)
    overtone.stop(now + 0.92)
  }
}
