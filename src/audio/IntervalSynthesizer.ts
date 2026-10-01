// ─── IntervalSynthesizer ───
// Generates 100% algorithmically synthesized audio buffers for interval alerts:
// Bell, Chime, Double Beep, and Ocean Waves.
// Pure Web Audio API — no external files or React dependencies.

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
        buffer = this.createDoubleBeepBuffer(ctx);
        break;
      case 'waves':
        buffer = this.createWavesBuffer(ctx);
        break;
    }

    ctxMap.set(tone, buffer);
    return buffer;
  }

  /**
   * 100% Synthesized Ocean Waves Sound (~4.5s):
   * Generates organic pink noise, applies a natural swell building envelope,
   * modulates a dynamic lowpass filter cutoff to model the wave crest & rushing surf,
   * and ends with a soft foam recession and gentle sub-bass rumble.
   */
  static createWavesBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 4.5; // 4.5 seconds
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // 1. Generate pink noise using Paul Kellet's filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    const rawNoise = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.76160 * b5 - white * 0.0168980;
      rawNoise[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
    }

    // 2. Wave swell simulation:
    // Wave builds gently from 0.0s to 1.8s (gathering depth)
    // Crests with rushing surf between 1.8s and 2.4s (higher frequencies emerge)
    // Recedes and foams softly from 2.4s to 4.5s
    let filterState = 0;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Swell volume envelope
      let swell: number;
      if (t < 1.8) {
        swell = 0.5 * (1 - Math.cos((Math.PI * t) / 1.8));
      } else {
        const rel = (t - 1.8) / (duration - 1.8);
        swell = Math.pow(Math.max(0, 1 - rel), 1.6);
      }

      // Dynamic cutoff: rises during wave surge (from 160 Hz up to 820 Hz), then recedes softly
      let cutoffHz: number;
      if (t < 1.8) {
        cutoffHz = 160 + 660 * (t / 1.8);
      } else if (t < 2.5) {
        cutoffHz = 820 - 320 * ((t - 1.8) / 0.7);
      } else {
        cutoffHz = 500 * Math.max(0.1, 1 - (t - 2.5) / (duration - 2.5));
      }

      // 1-pole lowpass filter smoothing
      const rc = 1.0 / (2 * Math.PI * cutoffHz);
      const dt = 1.0 / sampleRate;
      const alpha = dt / (rc + dt);
      filterState += alpha * (rawNoise[i] - filterState);

      // Add subtle low sub-rumble sine wave (45 Hz) to give physical mass to the wave swell
      const rumble = 0.18 * Math.sin(2 * Math.PI * 45.0 * t) * swell;

      data[i] = (filterState * 0.9 + rumble) * swell;
    }

    // Normalized gentle low volume (0.16)
    this.normalize(data, 0.16);
    return buffer;
  }

  /**
   * Double Beep Notification:
   * Two short gentle tones with a short gap in between.
   * Beep 1: 0.00s–0.11s, Pause: 0.11s–0.18s, Beep 2: 0.18s–0.29s.
   * Lowered default volume (0.13).
   */
  static createDoubleBeepBuffer(ctx: BaseAudioContext): AudioBuffer {
    const duration = 0.38; // 380ms total
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 784.0; // G5 - gentle, clear, pleasant tone
    const beep1Start = 0.0;
    const beep1End = 0.11;
    const beep2Start = 0.18;
    const beep2End = 0.29;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let env = 0;

      // Beep 1
      if (t >= beep1Start && t <= beep1End) {
        const localT = t - beep1Start;
        const dur = beep1End - beep1Start;
        if (localT < 0.02) {
          env = 0.5 * (1 - Math.cos((Math.PI * localT) / 0.02));
        } else if (localT > dur - 0.03) {
          env = 0.5 * (1 + Math.cos((Math.PI * (localT - (dur - 0.03))) / 0.03));
        } else {
          env = 1.0;
        }
      }
      // Beep 2
      else if (t >= beep2Start && t <= beep2End) {
        const localT = t - beep2Start;
        const dur = beep2End - beep2Start;
        if (localT < 0.02) {
          env = 0.5 * (1 - Math.cos((Math.PI * localT) / 0.02));
        } else if (localT > dur - 0.03) {
          env = 0.5 * (1 + Math.cos((Math.PI * (localT - (dur - 0.03))) / 0.03));
        } else {
          env = 1.0;
        }
      }

      if (env > 0) {
        const sample = Math.sin(2 * Math.PI * f0 * t) + 0.12 * Math.sin(2 * Math.PI * f0 * 2 * t);
        data[i] = sample * env;
      }
    }

    // Lowered default volume (0.13)
    this.normalize(data, 0.13);
    return buffer;
  }

  /**
   * Meditative Bell with quick fade out (~1.4s duration) and reduced internal volume (0.14).
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

    // Lowered default volume (0.14)
    this.normalize(data, 0.14);
    return buffer;
  }

  /**
   * Crystalline Chime with quick fade out (~1.1s duration) and reduced internal volume (0.12).
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

    // Lowered default volume (0.12)
    this.normalize(data, 0.12);
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
