// ─── AmbientPlayer ───
// Plays multiple ambient sound layers (noise or audio files) simultaneously with independent volume controls.
// Pure Web Audio API — no React.

import { NoiseGenerator } from './NoiseGenerator.ts';
import type { AmbientLayer } from '../types/index.ts';

/** Scaling factor to keep ambient layers subtler by default beneath the binaural tones */
export const AMBIENT_GAIN_SCALE = 0.35;

/** IDs of noise types that are generated in code (no file needed). */
const GENERATED_NOISE_IDS = ['white-noise', 'pink-noise', 'brown-noise', 'black-noise'] as const;

interface ActiveLayer {
  layerId: string;
  soundId: string | null;
  volume: number;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
}

export class AmbientPlayer {
  private ctx: AudioContext;
  private destination: AudioNode;
  private layers = new Map<string, ActiveLayer>();
  private _isPlaying = false;

  /** Cache so we don't regenerate noise buffers every time. */
  private bufferCache = new Map<string, AudioBuffer>();

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
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
          sourceNode: null,
          gainNode,
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

    const buffer = await this.getBuffer(layer.soundId);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(layer.gainNode);
    source.start();
    layer.sourceNode = source;
  }

  private stopLayer(layer: ActiveLayer): void {
    if (layer.sourceNode) {
      try {
        layer.sourceNode.stop();
      } catch {
        // Ignore if already stopped
      }
      layer.sourceNode.disconnect();
      layer.sourceNode = null;
    }
  }

  /** Start playing all active ambient layers that have a selected sound. */
  async play(): Promise<void> {
    this._isPlaying = true;
    for (const layer of this.layers.values()) {
      if (layer.soundId && !layer.sourceNode) {
        await this.startLayer(layer);
      }
    }
  }

  /** Stop all ambient sound playback. */
  stop(): void {
    this._isPlaying = false;
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

    if ((GENERATED_NOISE_IDS as readonly string[]).includes(id)) {
      const buffer = this.generateNoise(id);
      this.bufferCache.set(id, buffer);
      return buffer;
    }

    const src = this.getFilePath(id);
    if (!src) return null;

    try {
      const response = await fetch(src);
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
      rain: '/ambient/rain.mp3',
      'forest-rain': '/ambient/forest-rain.mp3',
      'ocean-waves': '/ambient/ocean-waves.mp3',
    };
    return paths[id] ?? null;
  }
}
