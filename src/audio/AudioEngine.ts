// ─── AudioEngine ───
// Singleton that owns the AudioContext and manages the audio graph.
// Pure TypeScript — no React imports.
//
// Graph:
//   BinauralNode (stereo) ──┐
//                           ├──► masterGain → destination
//   AmbientPlayer (loop) ──┘

import { AmbientPlayer } from './AmbientPlayer.ts';
import { BinauralNode } from './BinauralNode.ts';
import { FadeController } from './FadeController.ts';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx: AudioContext | null = null;
  private binauralNode: BinauralNode | null = null;
  private ambientPlayer: AmbientPlayer | null = null;
  private masterGain: GainNode | null = null;

  // Stored params (applied to nodes when they exist)
  private carrierFreq = 200;
  private beatFreq = 3;
  private masterVol = 0.5;
  private leftVol = 1;
  private rightVol = 1;
  private _selectedAmbientId: string | null = null;
  private _ambientVol = 0.5;

  private _playing = false;

  private constructor() {}

  /** Get (or create) the singleton instance. */
  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /** True when oscillators are running. */
  get isPlaying(): boolean {
    return this._playing;
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
      this.ambientPlayer.setVolume(this._ambientVol);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /** Start binaural-beat playback. Idempotent. */
  async play(): Promise<void> {
    if (this._playing) return;

    const ctx = await this.ensureContext();

    this.binauralNode = new BinauralNode(ctx, this.carrierFreq, this.beatFreq);
    this.binauralNode.setLeftVolume(this.leftVol);
    this.binauralNode.setRightVolume(this.rightVol);
    this.binauralNode.output.connect(this.masterGain!);
    this.binauralNode.start();

    // Start ambient if one is selected
    if (this._selectedAmbientId) {
      await this.ambientPlayer!.play(this._selectedAmbientId);
    }

    this._playing = true;
  }

  /** Stop playback and tear down oscillators. */
  stop(): void {
    if (!this._playing) return;

    this.binauralNode?.dispose();
    this.binauralNode = null;
    this.ambientPlayer?.stop();
    this._playing = false;
  }

  /** Close the AudioContext entirely. Resets the singleton. */
  async dispose(): Promise<void> {
    this.stop();
    this.ambientPlayer?.dispose();
    this.ambientPlayer = null;
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
    AudioEngine.instance = null;
  }

  // ── Frequency setters ──

  setCarrierFrequency(hz: number): void {
    this.carrierFreq = hz;
    this.binauralNode?.setCarrierFrequency(hz);
  }

  setBeatFrequency(hz: number): void {
    this.beatFreq = hz;
    this.binauralNode?.setBeatFrequency(hz);
  }

  // ── Volume setters ──

  setMasterVolume(v: number): void {
    this.masterVol = v;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  setLeftVolume(v: number): void {
    this.leftVol = v;
    this.binauralNode?.setLeftVolume(v);
  }

  setRightVolume(v: number): void {
    this.rightVol = v;
    this.binauralNode?.setRightVolume(v);
  }

  // ── Ambient ──

  /** Switch the ambient sound. Pass null to disable ambient. */
  async setAmbient(id: string | null): Promise<void> {
    this._selectedAmbientId = id;
    if (!this._playing || !this.ambientPlayer) return;

    if (id) {
      await this.ambientPlayer.play(id);
    } else {
      this.ambientPlayer.stop();
    }
  }

  setAmbientVolume(v: number): void {
    this._ambientVol = v;
    this.ambientPlayer?.setVolume(v);
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
}
