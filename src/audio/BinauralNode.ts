// ─── BinauralNode ───
// Dual-oscillator stereo pair that produces a binaural beat.
// Pure Web Audio API — no React.
//
// Graph:
//   L Oscillator → L Gain → Merger(0) ─┐
//                                        ├→ (output)
//   R Oscillator → R Gain → Merger(1) ─┘

export class BinauralNode {
  private ctx: AudioContext;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode;
  private rightGain: GainNode;
  private merger: ChannelMergerNode;

  private carrierFreq: number;
  private beatFreq: number;

  constructor(ctx: AudioContext, carrier: number, beat: number) {
    this.ctx = ctx;
    this.carrierFreq = carrier;
    this.beatFreq = beat;

    // Persistent gain nodes (survive start/stop cycles)
    this.leftGain = ctx.createGain();
    this.rightGain = ctx.createGain();

    // Merge two mono signals into one stereo signal
    this.merger = ctx.createChannelMerger(2);
    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
  }

  /** The stereo output node — connect this to the next stage. */
  get output(): ChannelMergerNode {
    return this.merger;
  }

  /** Create oscillators and start them. Idempotent. */
  start(): void {
    if (this.leftOsc) return;

    this.leftOsc = this.ctx.createOscillator();
    this.rightOsc = this.ctx.createOscillator();

    this.leftOsc.type = 'sine';
    this.rightOsc.type = 'sine';

    this.applyFrequencies();

    this.leftOsc.connect(this.leftGain);
    this.rightOsc.connect(this.rightGain);

    this.leftOsc.start();
    this.rightOsc.start();
  }

  /** Stop and destroy oscillators. Safe to call when already stopped. */
  stop(): void {
    if (!this.leftOsc) return;

    this.leftOsc.stop();
    this.rightOsc!.stop();
    this.leftOsc.disconnect();
    this.rightOsc!.disconnect();
    this.leftOsc = null;
    this.rightOsc = null;
  }

  // ── Real-time setters ──

  setCarrierFrequency(hz: number): void {
    this.carrierFreq = hz;
    this.applyFrequencies();
  }

  setBeatFrequency(hz: number): void {
    this.beatFreq = hz;
    this.applyFrequencies();
  }

  setLeftVolume(v: number): void {
    this.leftGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  setRightVolume(v: number): void {
    this.rightGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  // ── Computed frequencies ──

  get leftFrequency(): number {
    return this.carrierFreq - this.beatFreq / 2;
  }

  get rightFrequency(): number {
    return this.carrierFreq + this.beatFreq / 2;
  }

  // ── Internal ──

  private applyFrequencies(): void {
    if (!this.leftOsc || !this.rightOsc) return;

    const t = this.ctx.currentTime;
    // Small time-constant for a smooth glide without clicks
    this.leftOsc.frequency.setTargetAtTime(this.leftFrequency, t, 0.02);
    this.rightOsc.frequency.setTargetAtTime(this.rightFrequency, t, 0.02);
  }

  /** Disconnect everything and release resources. */
  dispose(): void {
    this.stop();
    this.leftGain.disconnect();
    this.rightGain.disconnect();
    this.merger.disconnect();
  }
}
