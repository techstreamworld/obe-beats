// ─── NoiseGenerator ───
// Programmatically creates AudioBuffers for coloured noise.
// Pure Web Audio API — no React.

export class NoiseGenerator {
  /** White noise: uniform random samples. */
  static white(ctx: BaseAudioContext, durationSeconds = 2): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Pink noise: −3 dB/octave roll-off (Paul Kellet's refined method). */
  static pink(ctx: BaseAudioContext, durationSeconds = 2): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /** Brown (Brownian / red) noise: −6 dB/octave roll-off. */
  static brown(ctx: BaseAudioContext, durationSeconds = 2): AudioBuffer {
    const length = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }
}
