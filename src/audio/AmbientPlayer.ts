// ─── AmbientPlayer ───
// Plays multiple ambient sound layers (noise or audio files) simultaneously with independent volume controls.
// Reloops audio files with an exact 10-second crossfade between loops.
// Correctly cuts off audio in the middle of it if it will go over the session duration.
// Pure Web Audio API — no React.

import { NoiseGenerator } from './NoiseGenerator.ts';
import type { AmbientLayer } from '../types/index.ts';

/** Scaling factor to keep ambient layers subtler by default beneath the binaural tones */
export const AMBIENT_GAIN_SCALE = 0.35;

/** IDs of noise types that are generated in code (no file needed). */
const GENERATED_NOISE_IDS = ['white-noise', 'pink-noise', 'brown-noise', 'black-noise'] as const;

interface LoopInstance {
  source: AudioBufferSourceNode;
  crossGain: GainNode;
  startTime: number;
  stopTime: number;
}

interface ActiveLayer {
  layerId: string;
  soundId: string | null;
  volume: number;
  gainNode: GainNode;
  activeLoops: LoopInstance[];
  nextLoopStartTime: number;
  isFirstLoop: boolean;
  currentBuffer: AudioBuffer | null;
  noiseSourceNode: AudioBufferSourceNode | null;
}

export class AmbientPlayer {
  private ctx: AudioContext;
  private destination: AudioNode;
  private layers = new Map<string, ActiveLayer>();
  private _isPlaying = false;

  private sessionStartTime = 0;
  private sessionDuration = 0; // 0 = Off / infinite
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;

  /** Cache so we don't reload or regenerate buffers every time. */
  private bufferCache = new Map<string, AudioBuffer>();

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  /** Update session duration (in seconds, 0 = no limit/off). Adjusts active and future loop cutoffs. */
  setSessionDuration(seconds: number): void {
    this.sessionDuration = seconds;
    const sessionEndTime = seconds > 0 ? this.sessionStartTime + seconds : Infinity;

    for (const layer of this.layers.values()) {
      for (const loop of layer.activeLoops) {
        if (loop.stopTime > sessionEndTime) {
          try {
            loop.source.stop(sessionEndTime);
            loop.stopTime = sessionEndTime;
          } catch {
            // ignore if already ended
          }
        }
      }
      if (layer.noiseSourceNode && sessionEndTime < Infinity) {
        try {
          layer.noiseSourceNode.stop(sessionEndTime);
        } catch {
          // ignore
        }
      }
    }

    if (this._isPlaying) {
      this.scheduleAll();
    }
  }

  private getEffectiveGain(soundId: string | null, volume: number): number {
    if (!soundId) return 0;
    // Boost black noise volume so it has rich, powerful sub-bass presence
    const boost = soundId === 'black-noise' ? 1.6 : 1.0;
    return volume * AMBIENT_GAIN_SCALE * boost;
  }

  /**
   * Synchronize active ambient layers with the provided layer configurations.
   * Dynamically adds, updates, or tears down audio nodes per layer.
   */
  async syncLayers(configs: AmbientLayer[]): Promise<void> {
    const configIds = new Set(configs.map((c) => c.id));

    // 1. Remove layers that no longer exist in configs
    for (const [id, layer] of this.layers.entries()) {
      if (!configIds.has(id)) {
        this.stopLayer(layer);
        layer.gainNode.disconnect();
        this.layers.delete(id);
      }
    }

    // 2. Add or update each layer
    for (const config of configs) {
      let layer = this.layers.get(config.id);

      if (!layer) {
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(
          this.getEffectiveGain(config.soundId, config.volume),
          this.ctx.currentTime,
        );
        gainNode.connect(this.destination);

        layer = {
          layerId: config.id,
          soundId: config.soundId,
          volume: config.volume,
          gainNode,
          activeLoops: [],
          nextLoopStartTime: 0,
          isFirstLoop: true,
          currentBuffer: null,
          noiseSourceNode: null,
        };
        this.layers.set(config.id, layer);

        if (this._isPlaying && config.soundId) {
          await this.startLayer(layer);
        }
      } else {
        // Update volume smoothly
        const targetGain = this.getEffectiveGain(config.soundId, config.volume);
        layer.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
        layer.volume = config.volume;

        // If sound changed on this layer
        if (layer.soundId !== config.soundId) {
          this.stopLayer(layer);
          layer.soundId = config.soundId;
          if (this._isPlaying && config.soundId) {
            await this.startLayer(layer);
          }
        }
      }
    }
  }

  private async startLayer(layer: ActiveLayer): Promise<void> {
    if (!layer.soundId) return;

    this.stopLayer(layer);
    const soundId = layer.soundId;

    const buffer = await this.getBuffer(soundId);
    if (!buffer || !this._isPlaying || layer.soundId !== soundId) return;

    if ((GENERATED_NOISE_IDS as readonly string[]).includes(soundId as typeof GENERATED_NOISE_IDS[number])) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(layer.gainNode);
      source.start();

      if (this.sessionDuration > 0) {
        const sessionEndTime = this.sessionStartTime + this.sessionDuration;
        if (sessionEndTime > this.ctx.currentTime) {
          source.stop(sessionEndTime);
        } else {
          source.stop();
        }
      }
      layer.noiseSourceNode = source;
      return;
    }

    // Audio file layer with 10s crossfade relooping
    layer.currentBuffer = buffer;
    layer.nextLoopStartTime = Math.max(this.ctx.currentTime, this.sessionStartTime);
    layer.isFirstLoop = true;
    this.scheduleLayerLoops(layer);
  }

  private scheduleLayerLoops(layer: ActiveLayer): void {
    if (!this._isPlaying || !layer.currentBuffer) return;

    const buffer = layer.currentBuffer;
    const D = buffer.duration;
    const X = Math.min(10.0, D / 2);
    const stepTime = D - X;

    const sessionEndTime = this.sessionDuration > 0
      ? this.sessionStartTime + this.sessionDuration
      : Infinity;

    const lookahead = 25.0; // schedule up to 25s ahead of ctx.currentTime

    if (layer.nextLoopStartTime < this.ctx.currentTime - 1.0) {
      layer.nextLoopStartTime = this.ctx.currentTime;
      layer.isFirstLoop = true;
    }

    while (layer.nextLoopStartTime < this.ctx.currentTime + lookahead) {
      const tStart = layer.nextLoopStartTime;
      if (tStart >= sessionEndTime) {
        break;
      }

      const tStop = Math.min(sessionEndTime, tStart + D);
      if (tStop <= tStart) break;

      const crossGain = this.ctx.createGain();
      crossGain.connect(layer.gainNode);

      // Incoming crossfade: 10-second linear ramp (starts immediately at 1.0 on very first loop)
      if (layer.isFirstLoop) {
        crossGain.gain.setValueAtTime(1.0, tStart);
        layer.isFirstLoop = false;
      } else {
        crossGain.gain.setValueAtTime(0.0, tStart);
        crossGain.gain.linearRampToValueAtTime(1.0, Math.min(sessionEndTime, tStart + X));
      }

      // Outgoing crossfade at end of buffer: 10-second linear ramp down to 0
      const tFadeOutStart = tStart + D - X;
      if (tFadeOutStart < sessionEndTime) {
        crossGain.gain.setValueAtTime(1.0, tFadeOutStart);
        crossGain.gain.linearRampToValueAtTime(0.0, Math.min(sessionEndTime, tStart + D));
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(crossGain);
      source.start(tStart);
      source.stop(tStop); // Correctly cuts off in the middle if it goes over session duration!

      const instance: LoopInstance = {
        source,
        crossGain,
        startTime: tStart,
        stopTime: tStop,
      };
      layer.activeLoops.push(instance);

      source.onended = () => {
        try {
          source.disconnect();
          crossGain.disconnect();
        } catch {
          // ignore
        }
        const idx = layer.activeLoops.indexOf(instance);
        if (idx !== -1) {
          layer.activeLoops.splice(idx, 1);
        }
      };

      layer.nextLoopStartTime += stepTime;
    }
  }

  private scheduleAll(): void {
    if (!this._isPlaying) return;
    for (const layer of this.layers.values()) {
      if (layer.currentBuffer) {
        this.scheduleLayerLoops(layer);
      }
    }
  }

  private stopLayer(layer: ActiveLayer): void {
    for (const loop of layer.activeLoops) {
      try {
        loop.source.stop();
        loop.source.disconnect();
        loop.crossGain.disconnect();
      } catch {
        // ignore
      }
    }
    layer.activeLoops = [];
    layer.nextLoopStartTime = 0;
    layer.isFirstLoop = true;
    layer.currentBuffer = null;

    if (layer.noiseSourceNode) {
      try {
        layer.noiseSourceNode.stop();
        layer.noiseSourceNode.disconnect();
      } catch {
        // ignore
      }
      layer.noiseSourceNode = null;
    }
  }

  /** Start playing all active ambient layers that have a selected sound. */
  async play(sessionDuration?: number): Promise<void> {
    this._isPlaying = true;
    if (sessionDuration !== undefined) {
      this.sessionDuration = sessionDuration;
    }
    this.sessionStartTime = this.ctx.currentTime;

    for (const layer of this.layers.values()) {
      if (layer.soundId) {
        await this.startLayer(layer);
      }
    }

    if (!this.schedulerTimer) {
      this.schedulerTimer = setInterval(() => this.scheduleAll(), 500);
    }
  }

  /** Stop all ambient sound playback. */
  stop(): void {
    this._isPlaying = false;
    this.sessionStartTime = 0;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const layer of this.layers.values()) {
      this.stopLayer(layer);
    }
  }

  dispose(): void {
    this.stop();
    for (const layer of this.layers.values()) {
      layer.gainNode.disconnect();
    }
    this.layers.clear();
    this.bufferCache.clear();
  }

  // ── Backward Compatibility Wrappers ──

  async playLegacy(id: string): Promise<void> {
    await this.syncLayers([{ id: 'default', soundId: id, volume: 0.5 }]);
    await this.play();
  }

  setVolume(v: number): void {
    const defaultLayer = this.layers.get('default') || this.layers.values().next().value;
    if (defaultLayer) {
      defaultLayer.gainNode.gain.setTargetAtTime(
        this.getEffectiveGain(defaultLayer.soundId, v),
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  // ── Internal Buffer Loading ──

  private async getBuffer(id: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }

    if ((GENERATED_NOISE_IDS as readonly string[]).includes(id as typeof GENERATED_NOISE_IDS[number])) {
      const buffer = this.generateNoise(id);
      this.bufferCache.set(id, buffer);
      return buffer;
    }

    const src = this.getFilePath(id);
    if (!src) return null;

    try {
      const response = await fetch(encodeURI(src));
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(id, buffer);
      return buffer;
    } catch {
      console.warn(`Ambient sound "${id}" not available at ${src}`);
      return null;
    }
  }

  private generateNoise(id: string): AudioBuffer {
    switch (id) {
      case 'white-noise': return NoiseGenerator.white(this.ctx);
      case 'pink-noise':  return NoiseGenerator.pink(this.ctx);
      case 'brown-noise': return NoiseGenerator.brown(this.ctx);
      case 'black-noise': return NoiseGenerator.black(this.ctx);
      default: return NoiseGenerator.white(this.ctx);
    }
  }

  private getFilePath(id: string): string | null {
    const paths: Record<string, string> = {
      rain: '/sound/Rain.wav',
      'ocean-waves': '/sound/Ocean Waves.wav',
      river: '/sound/River.wav',
      fireplace: '/sound/Fireplace.wav',
    };
    return paths[id] ?? null;
  }
}
