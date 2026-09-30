// ─── NoiseGenerator ───
// Programmatically creates AudioBuffers for coloured noise with anti-hiss filtering,
// steady-state filter pre-roll, equal-power seamless loop crossfades, and peak normalization.
// Pure Web Audio API — no React.

export class NoiseGenerator {
  /**
   * Applies equal-power sinusoidal crossfade between the extra rendered tail and the head,
   * then normalizes amplitude directly in the output channel data so peaks don't exceed 0.95.
   *
   * Because rawData[loopLength] was calculated immediately after rawData[loopLength - 1]
   * in the continuous filter stream, the transition from the end of the buffer back to
   * sample 0 has zero phase jump, zero slope discontinuity, and 100% constant acoustic power.
   */
  private static finalizeSeamlessBuffer(
    rawData: Float32Array,
    target: Float32Array,
    loopLength: number,
    fadeSamples: number,
  ): void {
    // 1. Equal-power sinusoidal crossfade:
    //    Blend the extra tail (indices [loopLength .. loopLength + fadeSamples - 1])
    //    into the start of the buffer (indices [0 .. fadeSamples - 1]).
    for (let i = 0; i < fadeSamples; i++) {
      const t = i / fadeSamples;
      // sin^2(t * π/2) + cos^2(t * π/2) = 1 (constant energy across all frequencies)
      const gainHead = Math.sin(t * (Math.PI * 0.5));
      const gainTail = Math.cos(t * (Math.PI * 0.5));
      target[i] = rawData[i] * gainHead + rawData[loopLength + i] * gainTail;
    }

    // 2. Remainder of the buffer is continuous and untouched
    for (let i = fadeSamples; i < loopLength; i++) {
      target[i] = rawData[i];
    }

    // 3. Peak normalization (target max 0.95 to eliminate clipping)
    let peak = 0;
    for (let i = 0; i < loopLength; i++) {
      const abs = Math.abs(target[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.95) {
      const scale = 0.95 / peak;
      for (let i = 0; i < loopLength; i++) {
        target[i] *= scale;
      }
    }
  }

  /**
   * White noise: Softened full-spectrum noise with gentle 2-pole high roll-off (~3.8 kHz)
   * to remove the piercing, fatiguing treble hiss while preserving crisp, airy masking.
   */
  static white(ctx: BaseAudioContext, durationSeconds = 12): AudioBuffer {
    const loopLength = Math.floor(ctx.sampleRate * durationSeconds);
    const fadeSamples = Math.floor(ctx.sampleRate * 0.75); // 750ms crossfade
    const totalSamples = loopLength + fadeSamples;
    const rawData = new Float32Array(totalSamples);

    const rc = 1.0 / (2 * Math.PI * 3800);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = dt / (rc + dt);

    let y1 = 0;
    let y2 = 0;

    // Steady-state pre-roll warm-up (1 second) so sample 0 has zero initial transient
    const warmup = ctx.sampleRate;
    for (let i = 0; i < warmup; i++) {
      const w = Math.random() * 2 - 1;
      y1 += alpha * (w - y1);
      y2 += alpha * (y1 - y2);
    }

    // Generate seamless audio data
    for (let i = 0; i < totalSamples; i++) {
      const w = Math.random() * 2 - 1;
      y1 += alpha * (w - y1);
      y2 += alpha * (y1 - y2);
      rawData[i] = y2 * 1.5;
    }

    const buffer = ctx.createBuffer(1, loopLength, ctx.sampleRate);
    this.finalizeSeamlessBuffer(rawData, buffer.getChannelData(0), loopLength, fadeSamples);
    return buffer;
  }

  /**
   * Pink noise: −3 dB/octave roll-off with smoothed direct feedthrough and gentle
   * high-cut filter (~2.2 kHz) to eliminate the harsh bacon-sizzle hiss, producing
   * a soft, soothing, natural rainfall texture.
   */
  static pink(ctx: BaseAudioContext, durationSeconds = 12): AudioBuffer {
    const loopLength = Math.floor(ctx.sampleRate * durationSeconds);
    const fadeSamples = Math.floor(ctx.sampleRate * 0.75); // 750ms crossfade
    const totalSamples = loopLength + fadeSamples;
    const rawData = new Float32Array(totalSamples);

    const rc = 1.0 / (2 * Math.PI * 2200);
    const dt = 1.0 / ctx.sampleRate;
    const alpha = dt / (rc + dt);
    let lp = 0;

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Steady-state pre-roll warm-up (1 second)
    const warmup = ctx.sampleRate;
    for (let i = 0; i < warmup; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const rawPink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.18) * 0.14;
      b6 = white * 0.115926;
      lp += alpha * (rawPink - lp);
    }

    // Generate seamless audio data
    for (let i = 0; i < totalSamples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const rawPink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.18) * 0.14;
      b6 = white * 0.115926;
      lp += alpha * (rawPink - lp);
      rawData[i] = lp * 1.5;
    }

    const buffer = ctx.createBuffer(1, loopLength, ctx.sampleRate);
    this.finalizeSeamlessBuffer(rawData, buffer.getChannelData(0), loopLength, fadeSamples);
    return buffer;
  }

  /**
   * Brown (Brownian / red) noise: −6 dB/octave roll-off with deep, warm waterfall/surf character.
   */
  static brown(ctx: BaseAudioContext, durationSeconds = 12): AudioBuffer {
    const loopLength = Math.floor(ctx.sampleRate * durationSeconds);
    const fadeSamples = Math.floor(ctx.sampleRate * 0.75); // 750ms crossfade
    const totalSamples = loopLength + fadeSamples;
    const rawData = new Float32Array(totalSamples);

    let lastOut = 0;

    // Steady-state pre-roll warm-up (1 second)
    const warmup = ctx.sampleRate;
    for (let i = 0; i < warmup; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
    }

    // Generate seamless audio data
    for (let i = 0; i < totalSamples; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      rawData[i] = lastOut * 3.5;
    }

    const buffer = ctx.createBuffer(1, loopLength, ctx.sampleRate);
    this.finalizeSeamlessBuffer(rawData, buffer.getChannelData(0), loopLength, fadeSamples);
    return buffer;
  }

  /**
   * Black noise: Ultra-deep low-frequency sub-bass void (< 110 Hz, −18 dB/octave)
   * with harmonic saturation and DC blocking. Creates a rich, velvety, deep-rumbling
   * presence with boosted volume, steady-state warm-up, and zero high-frequency hiss or clicks.
   */
  static black(ctx: BaseAudioContext, durationSeconds = 12): AudioBuffer {
    const loopLength = Math.floor(ctx.sampleRate * durationSeconds);
    const fadeSamples = Math.floor(ctx.sampleRate * 0.75); // 750ms crossfade
    const totalSamples = loopLength + fadeSamples;
    const rawData = new Float32Array(totalSamples);

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

    // Steady-state pre-roll warm-up (1 second) so sub-bass filters settle before sample 0
    const warmup = ctx.sampleRate;
    for (let i = 0; i < warmup; i++) {
      const white = Math.random() * 2 - 1;
      s1 += alpha * (white - s1);
      s2 += alpha * (s1 - s2);
      s3 += alpha * (s2 - s3);

      const dcFiltered = s3 - prevX + dcAlpha * prevY;
      prevX = s3;
      prevY = dcFiltered;

      const saturated = Math.tanh(dcFiltered * 32.0) * 0.95;
      postFilter += alphaPost * (saturated - postFilter);
    }

    // Generate seamless audio data
    for (let i = 0; i < totalSamples; i++) {
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

      rawData[i] = postFilter;
    }

    const buffer = ctx.createBuffer(1, loopLength, ctx.sampleRate);
    this.finalizeSeamlessBuffer(rawData, buffer.getChannelData(0), loopLength, fadeSamples);
    return buffer;
  }
}
