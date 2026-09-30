// ─── NoiseGenerator ───
// Programmatically creates AudioBuffers for coloured noise with anti-hiss filtering,
// peak normalization, and seamless loop crossfades.
// Pure Web Audio API — no React.

export class NoiseGenerator {
  /**
   * Post-processes audio buffer:
   * 1. Normalizes amplitude so peaks don't exceed 0.95 (prevents clipping).
   * 2. Smooths the start and end boundary over 50ms for seamless click-free looping.
   */
  private static finalizeBuffer(data: Float32Array, length: number): void {
    let peak = 0;
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.95) {
      const scale = 0.95 / peak;
      for (let i = 0; i < length; i++) {
        data[i] *= scale;
      }
    }

    // Seamless loop crossfade (first/last 2048 samples ~46ms at 44.1kHz)
    const fadeSamples = Math.min(2048, Math.floor(length / 10));
    for (let i = 0; i < fadeSamples; i++) {
      const t = i / fadeSamples;
      data[i] = data[i] * t + data[length - fadeSamples + i] * (1 - t);
    }
  }

  /**
   * White noise: Softened full-spectrum noise with gentle 2-pole high roll-off (~3.8 kHz)
   * to remove the piercing, fatiguing treble hiss while preserving crisp, airy masking.
   */
  static white(ctx: BaseAudioContext, durationSeconds = 6): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const rc = 1.0 / (2 * Math.PI * 3800);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = dt / (rc + dt);

    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      y1 += alpha * (w - y1);
      y2 += alpha * (y1 - y2);
      data[i] = y2 * 1.5;
    }

    this.finalizeBuffer(data, length);
    return buffer;
  }

  /**
   * Pink noise: −3 dB/octave roll-off with smoothed direct feedthrough and gentle
   * high-cut filter (~2.2 kHz) to eliminate the harsh bacon-sizzle hiss, producing
   * a soft, soothing, natural rainfall texture.
   */
  static pink(ctx: BaseAudioContext, durationSeconds = 6): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const rc = 1.0 / (2 * Math.PI * 2200);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = dt / (rc + dt);
    let lp = 0;

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      // Reduced white feedthrough from 0.5362 to 0.18 to remove high-frequency sizzle
      const rawPink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.18) * 0.14;
      b6 = white * 0.115926;

      // Gentle smoothing low-pass
      lp += alpha * (rawPink - lp);
      data[i] = lp * 1.5;
    }

    this.finalizeBuffer(data, length);
    return buffer;
  }

  /**
   * Brown (Brownian / red) noise: −6 dB/octave roll-off with deep, warm waterfall/surf character.
   */
  static brown(ctx: BaseAudioContext, durationSeconds = 6): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.finalizeBuffer(data, length);
    return buffer;
  }

  /**
   * Black noise: Ultra-deep low-frequency sub-bass void (< 110 Hz, −18 dB/octave)
   * with harmonic saturation and DC blocking. Creates a rich, velvety, deep-rumbling
   * presence with boosted volume and zero high-frequency hiss.
   */
  static black(ctx: BaseAudioContext, durationSeconds = 6): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const cutoff = 110;
    const rc = 1.0 / (2 * Math.PI * cutoff);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = dt / (rc + dt);

    // Post-filter to ensure zero treble above 220 Hz
    const rcPost = 1.0 / (2 * Math.PI * 220);
    const alphaPost = dt / (rcPost + dt);
    let postFilter = 0;

    // DC blocker (~15 Hz)
    const dcAlpha = 0.998;
    let prevX = 0;
    let prevY = 0;

    let s1 = 0, s2 = 0, s3 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      s1 += alpha * (white - s1);
      s2 += alpha * (s1 - s2);
      s3 += alpha * (s2 - s3);

      const dcFiltered = s3 - prevX + dcAlpha * prevY;
      prevX = s3;
      prevY = dcFiltered;

      // Soft saturation to significantly boost perceived sub-bass loudness and body
      const saturated = Math.tanh(dcFiltered * 32.0) * 0.95;
      postFilter += alphaPost * (saturated - postFilter);

      data[i] = postFilter;
    }

    this.finalizeBuffer(data, length);
    return buffer;
  }
}
