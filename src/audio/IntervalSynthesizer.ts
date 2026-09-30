// ─── IntervalSynthesizer ───
// Generates 100% algorithmically synthesized audio buffers for interval alerts:
// Bell, Chime, Beep, and Bounce. Pure Web Audio API — no external files or React dependencies.

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
      case 'bounce':
        buffer = this.createBounceBuffer(ctx);
        break;
    }

    ctxMap.set(tone, buffer);
    return buffer;
  }

  /**
   * 5-Second Soft Bouncy Notification Sound:
   * 5 gentle sine tones with downward pitch drop (258 Hz → 222 Hz)
   * at exact timing offsets: 0.0s, 0.7s, 1.6s, 2.8s, 4.1s.
   * Soft attack, smooth fade-out, zero sharp high frequencies.
   */
  static createBounceBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 5.0; // 5 seconds
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const startTimes = [0.0, 0.7, 1.6, 2.8, 4.1];
    const toneDuration = 0.25; // 250ms (within 200–300 ms range)
    const attackTime = 0.025; // 25ms soft attack
    const releaseTime = toneDuration - attackTime; // 225ms fade-out

    // Slight physical damping across the 5 successive bounces
    const bounceAmps = [1.0, 0.92, 0.85, 0.78, 0.72];

    for (let k = 0; k < startTimes.length; k++) {
      const startTime = startTimes[k];
      const startSample = Math.floor(startTime * sampleRate);
      const toneSamples = Math.floor(toneDuration * sampleRate);
      const bAmp = bounceAmps[k];

      let phase = 0;
      for (let i = 0; i < toneSamples; i++) {
        const destIdx = startSample + i;
        if (destIdx >= length) break;

        const tau = i / sampleRate;

        // Gentle downward pitch drop from 258 Hz down to 222 Hz
        const freq = 258.0 - 36.0 * (tau / toneDuration);
        phase += (2 * Math.PI * freq) / sampleRate;

        // Soft attack and smooth cosine fade-out
        let env: number;
        if (tau < attackTime) {
          env = 0.5 * (1 - Math.cos((Math.PI * tau) / attackTime));
        } else {
          const relProgress = (tau - attackTime) / releaseTime;
          env = 0.5 * (1 + Math.cos(Math.PI * relProgress));
        }

        // Pure sine wave with gentle envelope
        const sample = Math.sin(phase) * env * bAmp;
        data[destIdx] += sample;
      }
    }

    // Keep volume low and gentle (0.45)
    this.normalize(data, 0.45);
    return buffer;
  }

  /**
   * Meditative Bell with quick fade out (~1.4s duration) and reduced internal volume (0.40).
   */
  static createBellBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 1.4; // Quick fade out
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 528.0;

    const partials = [
      { freq: f0, amp: 0.65, tau: 0.45 },
      { freq: f0 + 1.8, amp: 0.45, tau: 0.45 },
      { freq: f0 * 2.0, amp: 0.30, tau: 0.35 },
      { freq: f0 * 2.76, amp: 0.20, tau: 0.25 },
      { freq: f0 * 4.07, amp: 0.12, tau: 0.18 },
      { freq: f0 * 5.43, amp: 0.06, tau: 0.12 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1.0, t / 0.005);
      // Clean fade out over the final 200ms
      const fadeOut = t > duration - 0.2 ? Math.max(0, (duration - t) / 0.2) : 1.0;

      let sample = 0;
      for (const p of partials) {
        sample += p.amp * Math.sin(2 * Math.PI * p.freq * t) * Math.exp(-t / p.tau);
      }

      const mallet = (Math.random() * 2 - 1) * Math.exp(-t / 0.008) * 0.12;
      data[i] = (sample + mallet) * attack * fadeOut;
    }

    // Lower default volume internally (0.40)
    this.normalize(data, 0.40);
    return buffer;
  }

  /**
   * Crystalline Chime with quick fade out (~1.1s duration) and reduced internal volume (0.35).
   */
  static createChimeBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 1.1; // Quick fade out
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 1174.66; // D6 high tubular chime

    const partials = [
      { freq: f0, amp: 0.70, tau: 0.40 },
      { freq: f0 * 2.756, amp: 0.30, tau: 0.25 },
      { freq: f0 * 5.404, amp: 0.15, tau: 0.15 },
      { freq: f0 * 8.93, amp: 0.05, tau: 0.08 },
    ];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1.0, t / 0.004);
      // Clean fade out over the final 150ms
      const fadeOut = t > duration - 0.15 ? Math.max(0, (duration - t) / 0.15) : 1.0;
      const tremolo = 1.0 + 0.10 * Math.sin(2 * Math.PI * 4.0 * t);

      let sample = 0;
      for (const p of partials) {
        sample += p.amp * Math.sin(2 * Math.PI * p.freq * t) * Math.exp(-t / p.tau);
      }

      data[i] = sample * tremolo * attack * fadeOut;
    }

    // Lower default volume internally (0.35)
    this.normalize(data, 0.35);
    return buffer;
  }

  /**
   * Mindfulness Beep with lowered internal volume (0.32).
   */
  static createBeepBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 0.25; // 250ms
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 880.0;
    const f1 = 1760.0;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let env: number;
      if (t < 0.02) {
        env = 0.5 * (1 - Math.cos((Math.PI * t) / 0.02));
      } else if (t < 0.08) {
        env = 1.0;
      } else {
        const relT = (t - 0.08) / (duration - 0.08);
        env = 0.5 * (1 + Math.cos(Math.PI * relT));
      }

      const sample = Math.sin(2 * Math.PI * f0 * t) + 0.15 * Math.sin(2 * Math.PI * f1 * t);
      data[i] = sample * env;
    }

    // Lower default volume internally (0.32)
    this.normalize(data, 0.32);
    return buffer;
  }

  /** Normalizes peak amplitude to the target level. */
  private static normalize(data: Float32Array, targetPeak = 0.95): void {
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.0001) {
      const scale = targetPeak / peak;
      for (let i = 0; i < data.length; i++) {
        data[i] *= scale;
      }
    }
  }
}
