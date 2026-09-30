// ─── IntervalSynthesizer ───
// Generates 100% algorithmically synthesized audio buffers for interval alerts:
// Bell, Chime, and Beep. Pure Web Audio API — no external files or React dependencies.

import type { IntervalTone } from '../types/index.ts';

export class IntervalSynthesizer {
  private static bufferCache = new WeakMap<BaseAudioContext, Map<IntervalTone, AudioBuffer>>();

  /**
   * Returns a cached AudioBuffer for the requested tone, or synthesizes it on-demand.
   */
  static getBuffer(ctx: BaseAudioContext, tone: IntervalTone): AudioBuffer {
    let ctxMap = this.bufferCache.get(ctx);
    if (!ctxMap) {
      ctxMap = new Map();
      this.bufferCache.set(ctx, ctxMap);
    }

    const cached = ctxMap.get(tone);
    if (cached) return cached;

    let buffer: AudioBuffer;
    switch (tone) {
      case 'bell':
        buffer = this.createBellBuffer(ctx);
        break;
      case 'chime':
        buffer = this.createChimeBuffer(ctx);
        break;
      case 'beep':
        buffer = this.createBeepBuffer(ctx);
        break;
    }

    ctxMap.set(tone, buffer);
    return buffer;
  }

  /**
   * Meditative Tibetan Singing Bowl / Temple Bell:
   * 528 Hz Solfeggio fundamental with inharmonic metallic modes,
   * subtle acoustic beating (1.8 Hz shimmer), and a soft mallet strike transient.
   */
  static createBellBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 2.5; // seconds
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 528.0; // 528 Hz transformation/meditation frequency

    // Partials: frequency, relative amplitude, exponential decay time tau (s)
    const partials = [
      { freq: f0, amp: 0.65, tau: 2.3 },
      { freq: f0 + 1.8, amp: 0.45, tau: 2.3 }, // Chorus beat for rich vibrating shimmer
      { freq: f0 * 2.0, amp: 0.35, tau: 1.5 },
      { freq: f0 * 2.76, amp: 0.25, tau: 1.1 },
      { freq: f0 * 4.07, amp: 0.15, tau: 0.7 },
      { freq: f0 * 5.43, amp: 0.08, tau: 0.4 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // 4ms smooth attack to eliminate any initial click
      const attack = Math.min(1.0, t / 0.004);

      let sample = 0;
      for (const p of partials) {
        sample += p.amp * Math.sin(2 * Math.PI * p.freq * t) * Math.exp(-t / p.tau);
      }

      // Soft mallet strike transient (8ms impulse)
      const mallet = (Math.random() * 2 - 1) * Math.exp(-t / 0.008) * 0.18;

      data[i] = (sample + mallet) * attack;
    }

    this.normalize(data);
    return buffer;
  }

  /**
   * Crystalline Wind / Tubular Chime:
   * 1174.66 Hz (D6) fundamental with Euler-Bernoulli cylindrical beam modes
   * and a gentle 4 Hz breeze shimmer.
   */
  static createChimeBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 2.0; // seconds
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 1174.66; // D6 high tubular chime

    const partials = [
      { freq: f0, amp: 0.70, tau: 1.8 },
      { freq: f0 * 2.756, amp: 0.35, tau: 1.0 },
      { freq: f0 * 5.404, amp: 0.18, tau: 0.5 },
      { freq: f0 * 8.93, amp: 0.06, tau: 0.25 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1.0, t / 0.003); // 3ms attack
      const tremolo = 1.0 + 0.12 * Math.sin(2 * Math.PI * 4.0 * t); // 4 Hz shimmer

      let sample = 0;
      for (const p of partials) {
        sample += p.amp * Math.sin(2 * Math.PI * p.freq * t) * Math.exp(-t / p.tau);
      }

      data[i] = sample * tremolo * attack;
    }

    this.normalize(data);
    return buffer;
  }

  /**
   * Clean Mindfulness Electronic Beep:
   * 880 Hz (A5) pure dual-harmonic tone with smooth raised-cosine envelope (zero click).
   */
  static createBeepBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 0.35; // 350ms
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 880.0; // A5 clean mindfulness tone
    const f1 = 1760.0; // A6 subtle harmonic presence

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Smooth envelope: 25ms attack, 100ms sustain, 225ms release
      let env: number;
      if (t < 0.025) {
        env = 0.5 * (1 - Math.cos((Math.PI * t) / 0.025));
      } else if (t < 0.125) {
        env = 1.0;
      } else {
        const relT = (t - 0.125) / (duration - 0.125);
        env = 0.5 * (1 + Math.cos(Math.PI * relT));
      }

      const sample = Math.sin(2 * Math.PI * f0 * t) + 0.18 * Math.sin(2 * Math.PI * f1 * t);
      data[i] = sample * env;
    }

    this.normalize(data);
    return buffer;
  }

  /** Normalizes peak amplitude to 0.95 to eliminate digital clipping. */
  private static normalize(data: Float32Array): void {
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.0001) {
      const scale = 0.95 / peak;
      for (let i = 0; i < data.length; i++) {
        data[i] *= scale;
      }
    }
  }
}
