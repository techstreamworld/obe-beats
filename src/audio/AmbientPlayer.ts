// ─── AmbientPlayer ───
// Plays a single ambient sound (noise or audio file) in a loop.
// Pure Web Audio API — no React.

import { NoiseGenerator } from './NoiseGenerator.ts';

/** IDs of noise types that are generated in code (no file needed). */
const GENERATED_NOISE_IDS = ['white-noise', 'pink-noise', 'brown-noise'] as const;

export class AmbientPlayer {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private sourceNode: AudioBufferSourceNode | null = null;
  private currentId: string | null = null;

  /** Cache so we don't regenerate noise buffers every time. */
  private bufferCache = new Map<string, AudioBuffer>();

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.connect(destination);
  }

  /** Start playing the ambient sound with the given id. */
  async play(id: string): Promise<void> {
    // Already playing this sound — no-op
    if (this.currentId === id && this.sourceNode) return;

    this.stop();

    const buffer = await this.getBuffer(id);
    if (!buffer) return; // file not available (placeholder)

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start();
    this.currentId = id;
  }

  /** Stop the currently playing ambient sound. */
  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // Already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.currentId = null;
  }

  setVolume(v: number): void {
    this.gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
  }

  get output(): GainNode {
    return this.gainNode;
  }

  get activeId(): string | null {
    return this.currentId;
  }

  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
    this.bufferCache.clear();
  }

  // ── Internal ──

  private async getBuffer(id: string): Promise<AudioBuffer | null> {
    // Return cached buffer if available
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }

    // Generated noise — create programmatically
    if ((GENERATED_NOISE_IDS as readonly string[]).includes(id)) {
      const buffer = this.generateNoise(id);
      this.bufferCache.set(id, buffer);
      return buffer;
    }

    // File-based sound — try to fetch
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
