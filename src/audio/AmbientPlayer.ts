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

/**
 * Returns sound-specific gain multiplier:
 * - Nature sounds (deep-sea, fireplace, rain, ocean-waves, river) are boosted for richer volume
 * - White noise is attenuated so it is not harsh/piercing
 * - Black noise is boosted for deep sub-bass
 */
export function getAmbientSoundBoost(soundId: string | null): number {
  if (!soundId) return 1.0;
  switch (soundId) {
    case 'deep-sea':
      return 3.5; // Louder, rich deep ocean presence
    case 'fireplace':
      return 2.3;
    case 'rain':
      return 2.1;
    case 'ocean-waves':
      return 2.3;
    case 'river':
      return 1.15; // More quiet gentle stream
    case 'white-noise':
      return 0.35; // Softened white noise
    case 'pink-noise':
      return 0.70; // Slightly lower pink noise
    case 'brown-noise':
      return 0.75; // Slightly lower brown noise
    case 'black-noise':
      return 1.6; // Rich sub-bass presence
    default:
      return 1.0;
  }
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
    const boost = getAmbientSoundBoost(soundId);
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

  /** Seek playback position to a specific elapsed point in seconds. */
  seek(elapsedSeconds: number, sessionDuration?: number): void {
    if (sessionDuration !== undefined) {
      this.sessionDuration = sessionDuration;
    }
    this.sessionStartTime = this.ctx.currentTime - elapsedSeconds;
    const sessionEndTime = this.sessionDuration > 0
      ? this.sessionStartTime + this.sessionDuration
      : Infinity;

    for (const layer of this.layers.values()) {
      // 1. Stop current in-flight loop instances
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

      // 2. If noise layer, update stop time
      if (layer.noiseSourceNode) {
        if (sessionEndTime < Infinity) {
          try {
            layer.noiseSourceNode.stop(sessionEndTime);
          } catch {
            // ignore
          }
        }
      }

      // 3. If audio file layer, restart loop at the correct offset
      if (this._isPlaying && layer.currentBuffer) {
        const buffer = layer.currentBuffer;
        const D = buffer.duration;
        const X = Math.min(10.0, D / 2);
        const stepTime = D - X;

        const offsetInStep = elapsedSeconds % stepTime;
        const bufferOffset = offsetInStep;
        const remainingPlay = D - bufferOffset;
        const tStart = this.ctx.currentTime;
        const tStop = Math.min(sessionEndTime, tStart + remainingPlay);

        if (tStop > tStart) {
          const crossGain = this.ctx.createGain();
          crossGain.connect(layer.gainNode);
          crossGain.gain.setValueAtTime(1.0, tStart);

          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(crossGain);
          source.start(tStart, bufferOffset);
          source.stop(tStop);

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

          layer.nextLoopStartTime = tStart + (stepTime - offsetInStep);
          layer.isFirstLoop = false;
        } else {
          layer.nextLoopStartTime = tStart;
          layer.isFirstLoop = false;
        }

        this.scheduleLayerLoops(layer);
      }
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
      'deep-sea': '/sound/Deep sea.wav',
    };
    return paths[id] ?? null;
  }
}
