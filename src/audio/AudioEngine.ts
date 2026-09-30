// ─── AudioEngine ───
// Singleton that owns the AudioContext and manages the audio graph.
// Pure TypeScript — no React imports.
//
// Graph:
//   BinauralNode (stereo) ──┐
//   AmbientPlayer (loop) ───┼──► masterGain → destination
//   IntervalPlayer ─────────┘

import { AmbientPlayer } from './AmbientPlayer.ts';
import { BinauralNode } from './BinauralNode.ts';
import { FadeController } from './FadeController.ts';
import { IntervalPlayer } from './IntervalPlayer.ts';
import type { AmbientLayer, IntervalTone } from '../types/index.ts';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx: AudioContext | null = null;
  private binauralNode: BinauralNode | null = null;
  private ambientPlayer: AmbientPlayer | null = null;
  private intervalPlayer: IntervalPlayer | null = null;
  private masterGain: GainNode | null = null;

  // Stored params (applied to nodes when they exist)
  private _binauralEnabled = true;
  private carrierFreq = 200;
  private beatFreq = 3;
  private toneVol = 0.5;
  private masterVol = 0.5;
  private leftVol = 1;
  private rightVol = 1;

  private _ambientEnabled = false;
  private _ambientLayers: AmbientLayer[] = [{ id: 'layer-1', soundId: null, volume: 0.5 }];

  // Interval tone configuration
  private intervalTone: IntervalTone = 'bell';
  private intervalMinutes = 0;
  private intervalVolume = 0.5;
  private previewChangeCallback?: (previewing: boolean) => void;

  private _playing = false;
  private _paused = false;

  private constructor() {}

  /** Get (or create) the singleton instance. */
  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /** True when audio is actively playing and not paused. */
  get isPlaying(): boolean {
    return this._playing && !this._paused;
  }

  /** True when audio is currently paused. */
  get isPaused(): boolean {
    return this._paused;
  }

  // ── Lifecycle ──

  /** Ensure the AudioContext + master gain exist and are resumed. */
  private async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.ambientPlayer = new AmbientPlayer(this.ctx, this.masterGain);
      if (this._ambientEnabled) {
        await this.ambientPlayer.syncLayers(this._ambientLayers);
      }

      this.intervalPlayer = new IntervalPlayer(this.ctx, this.masterGain);
      this.intervalPlayer.setConfig(this.intervalTone, this.intervalMinutes, this.intervalVolume);
      if (this.previewChangeCallback) {
        this.intervalPlayer.onPreviewChange(this.previewChangeCallback);
      }
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /** Start or resume playback. Idempotent. */
  async play(): Promise<void> {
    if (this._playing && !this._paused) return;

    const ctx = await this.ensureContext();

    if (this._paused) {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.intervalPlayer?.play();
      this._paused = false;
      return;
    }

    this.binauralNode = new BinauralNode(ctx, this.carrierFreq, this.beatFreq, this.toneVol);
    if (this._binauralEnabled) {
      this.binauralNode.setLeftVolume(this.leftVol);
      this.binauralNode.setRightVolume(this.rightVol);
    } else {
      this.binauralNode.setLeftVolume(0);
      this.binauralNode.setRightVolume(0);
    }
    this.binauralNode.output.connect(this.masterGain!);
    this.binauralNode.start();

    // Start ambient & interval playback
    if (this.ambientPlayer && this._ambientEnabled) {
      await this.ambientPlayer.play();
    }
    this.intervalPlayer?.play();

    this._playing = true;
    this._paused = false;
  }

  /** Pause playback without disposing the audio nodes. */
  async pause(): Promise<void> {
    if (!this._playing || this._paused) return;
    this.intervalPlayer?.pause();
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
    this._paused = true;
  }

  /** Stop playback and tear down oscillators. Unconditional and safe. */
  stop(): void {
    this.binauralNode?.dispose();
    this.binauralNode = null;
    this.ambientPlayer?.stop();
    this.intervalPlayer?.stop();
    this.stopIntervalPreview();
    this._playing = false;
    this._paused = false;

    // Reset master gain back to masterVol so future playback begins at normal level
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
    }
  }

  /** Restart playback from the beginning. */
  async restart(): Promise<void> {
    this.stop();
    await this.play();
  }

  /** Close the AudioContext entirely. Resets the singleton. */
  async dispose(): Promise<void> {
    this.stop();
    this.ambientPlayer?.dispose();
    this.ambientPlayer = null;
    this.intervalPlayer?.dispose();
    this.intervalPlayer = null;
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
    AudioEngine.instance = null;
  }

  // ── Binaural Enabled & Frequency setters ──

  setBinauralEnabled(enabled: boolean): void {
    this._binauralEnabled = enabled;
    if (this.binauralNode) {
      if (enabled) {
        this.binauralNode.setLeftVolume(this.leftVol);
        this.binauralNode.setRightVolume(this.rightVol);
      } else {
        this.binauralNode.setLeftVolume(0);
        this.binauralNode.setRightVolume(0);
      }
    }
  }

  setCarrierFrequency(hz: number): void {
    this.carrierFreq = hz;
    this.binauralNode?.setCarrierFrequency(hz);
  }

  setBeatFrequency(hz: number): void {
    this.beatFreq = hz;
    this.binauralNode?.setBeatFrequency(hz);
  }

  // ── Volume setters ──

  setBinauralVolume(v: number): void {
    this.toneVol = v;
    this.binauralNode?.setToneVolume(v);
  }

  setMasterVolume(v: number): void {
    this.masterVol = v;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  setLeftVolume(v: number): void {
    this.leftVol = v;
    if (this._binauralEnabled) {
      this.binauralNode?.setLeftVolume(v);
    }
  }

  setRightVolume(v: number): void {
    this.rightVol = v;
    if (this._binauralEnabled) {
      this.binauralNode?.setRightVolume(v);
    }
  }

  // ── Ambient ──

  async setAmbientEnabled(enabled: boolean): Promise<void> {
    this._ambientEnabled = enabled;
    if (this.ambientPlayer) {
      if (enabled) {
        await this.ambientPlayer.syncLayers(this._ambientLayers);
        if (this._playing && !this._paused) {
          await this.ambientPlayer.play();
        }
      } else {
        this.ambientPlayer.stop();
      }
    }
  }

  /** Set active ambient sound layers (multi-layer support). */
  async setAmbientLayers(layers: AmbientLayer[]): Promise<void> {
    this._ambientLayers = layers;
    if (this.ambientPlayer && this._ambientEnabled) {
      await this.ambientPlayer.syncLayers(layers);
    }
  }

  /** Switch the ambient sound on the primary layer. Pass null to disable ambient. */
  async setAmbient(id: string | null): Promise<void> {
    const updated = this._ambientLayers.length > 0
      ? [{ ...this._ambientLayers[0], soundId: id }, ...this._ambientLayers.slice(1)]
      : [{ id: 'layer-1', soundId: id, volume: 0.5 }];
    await this.setAmbientLayers(updated);
  }

  setAmbientVolume(v: number): void {
    const updated = this._ambientLayers.length > 0
      ? [{ ...this._ambientLayers[0], volume: v }, ...this._ambientLayers.slice(1)]
      : [{ id: 'layer-1', soundId: null, volume: v }];
    this.setAmbientLayers(updated);
  }

  // ── Interval Audio Layer ──

  setIntervalConfig(tone: IntervalTone, intervalMinutes: number, volume: number): void {
    this.intervalTone = tone;
    this.intervalMinutes = intervalMinutes;
    this.intervalVolume = volume;
    this.intervalPlayer?.setConfig(tone, intervalMinutes, volume);
  }

  onIntervalPreviewChange(cb: (previewing: boolean) => void): void {
    this.previewChangeCallback = cb;
    this.intervalPlayer?.onPreviewChange(cb);
  }

  async previewInterval(tone?: IntervalTone, volume?: number): Promise<void> {
    await this.ensureContext();
    if (tone) this.intervalTone = tone;
    if (volume !== undefined) this.intervalVolume = volume;
    this.intervalPlayer?.setConfig(this.intervalTone, this.intervalMinutes, this.intervalVolume);
    await this.intervalPlayer?.startPreview();
  }

  stopIntervalPreview(): void {
    this.intervalPlayer?.stopPreview();
  }

  // ── Fade helpers ──

  /** Ramp master gain from 0 → masterVolume over `seconds`. */
  fadeIn(seconds: number): void {
    if (this.masterGain && this.ctx) {
      FadeController.fadeIn(this.masterGain, this.ctx, this.masterVol, seconds);
    }
  }

  /** Ramp master gain from current → 0 over `seconds`. */
  fadeOut(seconds: number): void {
    if (this.masterGain && this.ctx) {
      FadeController.fadeOut(this.masterGain, this.ctx, seconds);
    }
  }

  /** Reset all internal engine state to factory defaults and stop all playback. */
  resetDefaults(): void {
    this.stop();
    this.carrierFreq = 200;
    this.beatFreq = 3;
    this.toneVol = 0.5;
    this.masterVol = 0.5;
    this.leftVol = 1.0;
    this.rightVol = 1.0;
    this._binauralEnabled = true;
    this._ambientEnabled = false;
    this._ambientLayers = [{ id: 'layer-1', soundId: null, volume: 0.5 }];
    this.intervalPlayer?.setConfig('bell', 0, 0.5);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    }
  }
}
