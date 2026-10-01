// ─── IntervalPlayer ───
// Manages the live audio layer for interval cues (Bell, Chime, Beep).
// Plays the selected tone 3 times with a 2-second pause in between, getting progressively louder.
// Pure Web Audio API — no React.

import { IntervalSynthesizer } from './IntervalSynthesizer.ts';
import type { IntervalTone } from '../types/index.ts';

export class IntervalPlayer {
  private ctx: AudioContext;
  private intervalGain: GainNode;
  private tone: IntervalTone = 'bell';
  private intervalMinutes = 0;
  private volume = 0.5;
  private repeatCount = 3;
  private isPlaying = false;

  private activeSources: AudioBufferSourceNode[] = [];
  private sessionStartAudioTime = 0;
  private nextIntervalSec = 0;
  private checkTimer: ReturnType<typeof setInterval> | null = null;

  private isPreviewing = false;
  private previewCallback?: (previewing: boolean) => void;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.intervalGain = this.ctx.createGain();
    this.intervalGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.intervalGain.connect(destination);
  }

  /** Registers a callback invoked whenever preview status toggles. */
  onPreviewChange(cb: (previewing: boolean) => void): void {
    this.previewCallback = cb;
  }

  private setPreviewing(val: boolean): void {
    if (this.isPreviewing !== val) {
      this.isPreviewing = val;
      this.previewCallback?.(val);
    }
  }

  /**
   * Updates tone, interval duration in minutes, layer volume, and repeat count.
   */
  setConfig(tone: IntervalTone, intervalMinutes: number, volume: number, repeatCount = 3): void {
    this.tone = tone;
    const oldMinutes = this.intervalMinutes;
    this.intervalMinutes = intervalMinutes;
    this.volume = volume;
    this.repeatCount = repeatCount;

    if (this.isPlaying && intervalMinutes > 0) {
      const elapsed = Math.max(0, this.ctx.currentTime - this.sessionStartAudioTime);
      if (oldMinutes !== intervalMinutes || this.nextIntervalSec === 0) {
        const intervalSec = intervalMinutes * 60;
        this.nextIntervalSec = (Math.floor(elapsed / intervalSec) + 1) * intervalSec;
      }
    } else if (intervalMinutes === 0) {
      this.nextIntervalSec = 0;
    }
  }

  /**
   * Begins or resumes interval monitoring during playback.
   */
  play(sessionAudioTime?: number): void {
    this.isPlaying = true;
    if (sessionAudioTime !== undefined) {
      this.sessionStartAudioTime = sessionAudioTime;
    } else if (this.sessionStartAudioTime === 0) {
      this.sessionStartAudioTime = this.ctx.currentTime;
    }

    if (this.intervalMinutes > 0 && this.nextIntervalSec === 0) {
      const elapsed = Math.max(0, this.ctx.currentTime - this.sessionStartAudioTime);
      const intervalSec = this.intervalMinutes * 60;
      this.nextIntervalSec = (Math.floor(elapsed / intervalSec) + 1) * intervalSec;
    }

    if (!this.checkTimer) {
      this.checkTimer = setInterval(() => this.checkIntervalTrigger(), 250);
    }
  }

  private checkIntervalTrigger(): void {
    if (!this.isPlaying || this.intervalMinutes <= 0 || this.volume <= 0) return;

    const elapsed = this.ctx.currentTime - this.sessionStartAudioTime;
    if (this.nextIntervalSec > 0 && elapsed >= this.nextIntervalSec) {
      this.playSequence(this.tone, this.volume, this.repeatCount);
      this.nextIntervalSec += this.intervalMinutes * 60;
    }
  }

  /**
   * Plays the tone N times (1 to 5) with a 2-second pause in between, getting progressively louder.
   * Volume scales up slightly with each play up to the target volume.
   */
  playSequence(
    tone: IntervalTone,
    volume: number,
    repeatCount = this.repeatCount,
    isPreview = false,
  ): void {
    if (volume <= 0) return;
    this.stopActiveStrikes();

    const buffer = IntervalSynthesizer.getBuffer(this.ctx, tone);
    const toneDuration = buffer.duration;
    const pauseSeconds = 2.0;
    const strikeInterval = toneDuration + pauseSeconds;

    const count = Math.max(1, Math.min(5, Math.floor(repeatCount || 3)));
    const multipliers = count === 1
      ? [1.0]
      : Array.from({ length: count }, (_, i) => 0.40 + (0.60 * i) / (count - 1));

    const baseTime = this.ctx.currentTime;

    multipliers.forEach((mult, index) => {
      const strikeTime = baseTime + index * strikeInterval;
      const strikeGain = this.ctx.createGain();
      strikeGain.gain.setValueAtTime(volume * mult, strikeTime);
      strikeGain.connect(this.intervalGain);

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(strikeGain);
      source.start(strikeTime);

      this.activeSources.push(source);

      source.onended = () => {
        try {
          source.disconnect();
          strikeGain.disconnect();
        } catch {
          // ignore
        }
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }

        if (isPreview && index === multipliers.length - 1) {
          this.setPreviewing(false);
        }
      };
    });

    if (isPreview) {
      this.setPreviewing(true);
    }
  }

  /**
   * Preview helper to immediately hear the progressively louder strikes.
   */
  async startPreview(repeatCount = this.repeatCount): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.playSequence(this.tone, this.volume, repeatCount, true);
  }

  /** Stops any ongoing preview or active strikes. */
  stopPreview(): void {
    this.stopActiveStrikes();
  }

  stopActiveStrikes(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeSources = [];
    this.setPreviewing(false);
  }

  pause(): void {
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
    this.sessionStartAudioTime = 0;
    this.nextIntervalSec = 0;
    this.stopActiveStrikes();
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  restart(sessionAudioTime?: number): void {
    this.stop();
    this.play(sessionAudioTime);
  }

  dispose(): void {
    this.stop();
    try {
      this.intervalGain.disconnect();
    } catch {
      // ignore
    }
  }
}
