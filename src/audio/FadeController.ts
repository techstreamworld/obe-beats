// ─── FadeController ───
// Utility for applying gain ramps (fade-in / fade-out) to any GainNode.
// Pure Web Audio API — no React.

export class FadeController {
  /**
   * Ramp a GainNode from 0 to `targetValue` over `durationSeconds`.
   * If duration is 0 the value is set instantly.
   */
  static fadeIn(
    gain: GainNode,
    ctx: AudioContext,
    targetValue: number,
    durationSeconds: number,
  ): void {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (durationSeconds <= 0) {
      gain.gain.setValueAtTime(targetValue, now);
      return;
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetValue, now + durationSeconds);
  }

  /**
   * Ramp a GainNode from its current value to 0 over `durationSeconds`.
   * If duration is 0 the value is set instantly.
   */
  static fadeOut(
    gain: GainNode,
    ctx: AudioContext,
    durationSeconds: number,
  ): void {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (durationSeconds <= 0) {
      gain.gain.setValueAtTime(0, now);
      return;
    }
    // Capture the current value so the ramp starts from the right level
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + durationSeconds);
  }
}
