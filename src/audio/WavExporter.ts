// ─── WavExporter ───
// Renders the session offline and encodes it to WAV or MP3 (320 kbps / 192 kbps).
// Pure Web Audio API / TypeScript — no React.

import { Mp3Encoder } from '@breezystack/lamejs';
import { AMBIENT_GAIN_SCALE } from './AmbientPlayer.ts';
import { NoiseGenerator } from './NoiseGenerator.ts';
import type { AmbientLayer } from '../types/index.ts';

export type ExportFormat = 'wav' | 'mp3-320' | 'mp3-192';

export interface RenderOptions {
  carrierFrequency: number;
  beatFrequency: number;
  masterVolume: number;
  leftVolume: number;
  rightVolume: number;
  ambientId?: string | null;
  ambientVolume?: number;
  ambientLayers?: AmbientLayer[];
  durationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  sampleRate?: number;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
}

export class WavExporter {
  /**
   * Calculates human-readable estimated file size based on duration and format.
   */
  static getEstimatedFileSize(durationSeconds: number, format: ExportFormat): string {
    const duration = Math.max(1, durationSeconds);
    let bytes = 0;

    switch (format) {
      case 'wav':
        // 44.1 kHz, 16-bit, 2 channels = 176,400 bytes/sec + 44 bytes header
        bytes = 44 + duration * 176400;
        break;
      case 'mp3-320':
        // 320 kbps = 40,000 bytes/sec
        bytes = duration * 40000;
        break;
      case 'mp3-192':
        // 192 kbps = 24,000 bytes/sec
        bytes = duration * 24000;
        break;
    }

    if (bytes >= 1024 * 1024) {
      return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `~${Math.round(bytes / 1024)} KB`;
  }

  /**
   * Renders the session to an AudioBuffer using OfflineAudioContext,
   * then encodes it to the chosen format (WAV, MP3 320, or MP3 192).
   */
  static async exportAudio(
    options: RenderOptions,
    format: ExportFormat = 'wav',
    onStatusChange?: (status: 'rendering' | 'encoding' | 'done') => void,
  ): Promise<ExportResult> {
    const sampleRate = options.sampleRate ?? 44100;
    const duration = Math.max(1, options.durationSeconds);
    const totalSamples = Math.floor(sampleRate * duration);

    onStatusChange?.('rendering');

    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // ── Master Gain & Fades ──
    const masterGain = offlineCtx.createGain();
    masterGain.connect(offlineCtx.destination);

    const masterVol = options.masterVolume;
    const fadeIn = Math.min(options.fadeInSeconds, duration);
    const fadeOut = Math.min(options.fadeOutSeconds, duration);

    if (fadeIn > 0) {
      masterGain.gain.setValueAtTime(0, 0);
      masterGain.gain.linearRampToValueAtTime(masterVol, fadeIn);
    } else {
      masterGain.gain.setValueAtTime(masterVol, 0);
    }

    if (fadeOut > 0) {
      const fadeOutStart = Math.max(0, duration - fadeOut);
      if (fadeOutStart > fadeIn) {
        masterGain.gain.setValueAtTime(masterVol, fadeOutStart);
      }
      masterGain.gain.linearRampToValueAtTime(0, duration);
    }

    // ── Binaural Oscillators ──
    const leftOsc = offlineCtx.createOscillator();
    const rightOsc = offlineCtx.createOscillator();
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';

    const leftFreq = Math.max(1, options.carrierFrequency - options.beatFrequency / 2);
    const rightFreq = Math.max(1, options.carrierFrequency + options.beatFrequency / 2);
    leftOsc.frequency.setValueAtTime(leftFreq, 0);
    rightOsc.frequency.setValueAtTime(rightFreq, 0);

    const leftGain = offlineCtx.createGain();
    const rightGain = offlineCtx.createGain();
    leftGain.gain.setValueAtTime(options.leftVolume, 0);
    rightGain.gain.setValueAtTime(options.rightVolume, 0);

    const merger = offlineCtx.createChannelMerger(2);
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);

    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);

    merger.connect(masterGain);

    leftOsc.start(0);
    leftOsc.stop(duration);
    rightOsc.start(0);
    rightOsc.stop(duration);

    // ── Ambient Sounds (multi-layer support) with default attenuation ──
    const layersToRender: AmbientLayer[] =
      options.ambientLayers && options.ambientLayers.length > 0
        ? options.ambientLayers
        : options.ambientId
          ? [{ id: 'default', soundId: options.ambientId, volume: options.ambientVolume ?? 0.5 }]
          : [];

    for (const layer of layersToRender) {
      if (!layer.soundId) continue;
      const boost = layer.soundId === 'black-noise' ? 1.6 : 1.0;
      const ambientGain = offlineCtx.createGain();
      ambientGain.gain.setValueAtTime(layer.volume * AMBIENT_GAIN_SCALE * boost, 0);
      ambientGain.connect(masterGain);

      const ambientBuffer = await this.getAmbientBuffer(offlineCtx, layer.soundId);
      if (ambientBuffer) {
        const ambientSource = offlineCtx.createBufferSource();
        ambientSource.buffer = ambientBuffer;
        ambientSource.loop = true;
        ambientSource.connect(ambientGain);
        ambientSource.start(0);
        ambientSource.stop(duration);
      }
    }

    // ── Offline Render ──
    const renderedBuffer = await offlineCtx.startRendering();

    // ── Encoding ──
    onStatusChange?.('encoding');

    let blob: Blob;
    let extension: string;
    const durationMin = Math.round(duration / 60) || 1;
    const baseName = `obe-beats_${options.carrierFrequency}hz_${options.beatFrequency}hz_${durationMin}m`;

    if (format === 'wav') {
      blob = this.encodeWav(renderedBuffer);
      extension = 'wav';
    } else {
      const kbps = format === 'mp3-320' ? 320 : 192;
      blob = this.encodeMp3(renderedBuffer, kbps);
      extension = `${kbps}kbps.mp3`;
    }

    const filename = `${baseName}.${extension}`;

    onStatusChange?.('done');
    return { blob, filename };
  }

  /** Backward-compatible exportToWav call */
  static async exportToWav(
    options: RenderOptions,
    onStatusChange?: (status: 'rendering' | 'encoding' | 'done') => void,
  ): Promise<Blob> {
    const result = await this.exportAudio(options, 'wav', onStatusChange);
    return result.blob;
  }

  /**
   * Helper to trigger download of a generated Blob in the browser.
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Internal Helpers ──

  private static async getAmbientBuffer(
    ctx: OfflineAudioContext,
    id: string,
  ): Promise<AudioBuffer | null> {
    switch (id) {
      case 'white-noise':
        return NoiseGenerator.white(ctx, 12);
      case 'pink-noise':
        return NoiseGenerator.pink(ctx, 12);
      case 'brown-noise':
        return NoiseGenerator.brown(ctx, 12);
      case 'black-noise':
        return NoiseGenerator.black(ctx, 12);
      default: {
        const pathMap: Record<string, string> = {
          rain: '/ambient/rain.mp3',
          'forest-rain': '/ambient/forest-rain.mp3',
          'ocean-waves': '/ambient/ocean-waves.mp3',
        };
        const src = pathMap[id];
        if (!src) return null;
        try {
          const res = await fetch(src);
          if (!res.ok) return null;
          const ab = await res.arrayBuffer();
          return await ctx.decodeAudioData(ab);
        } catch {
          return null;
        }
      }
    }
  }

  /**
   * Encodes an AudioBuffer into 16-bit PCM Stereo WAV format.
   */
  private static encodeWav(buffer: AudioBuffer): Blob {
    const numChannels = 2;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numFrames * blockAlign;
    const totalFileSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(totalFileSize);
    const view = new DataView(arrayBuffer);

    // ── RIFF Chunk Descriptor ──
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalFileSize - 8, true);
    this.writeString(view, 8, 'WAVE');

    // ── "fmt " Sub-chunk ──
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);             // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);              // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);    // NumChannels
    view.setUint32(24, sampleRate, true);     // SampleRate
    view.setUint32(28, byteRate, true);       // ByteRate
    view.setUint16(32, blockAlign, true);     // BlockAlign
    view.setUint16(34, 16, true);             // BitsPerSample (16 bits)

    // ── "data" Sub-chunk ──
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // ── Write Interleaved Samples ──
    const leftData = buffer.getChannelData(0);
    const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      let sLeft = leftData[i];
      sLeft = Math.max(-1, Math.min(1, sLeft));
      view.setInt16(offset, sLeft < 0 ? sLeft * 0x8000 : sLeft * 0x7FFF, true);
      offset += 2;

      let sRight = rightData[i];
      sRight = Math.max(-1, Math.min(1, sRight));
      view.setInt16(offset, sRight < 0 ? sRight * 0x8000 : sRight * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Encodes an AudioBuffer into MP3 format at the specified bitrate.
   */
  private static encodeMp3(buffer: AudioBuffer, kbps: number): Blob {
    const numChannels = 2;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;

    const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);

    const leftData = buffer.getChannelData(0);
    const rightData = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftData;

    // Convert Float32Array [-1.0, 1.0] to Int16Array
    const leftInt16 = new Int16Array(numFrames);
    const rightInt16 = new Int16Array(numFrames);

    for (let i = 0; i < numFrames; i++) {
      const sLeft = Math.max(-1, Math.min(1, leftData[i]));
      leftInt16[i] = sLeft < 0 ? sLeft * 0x8000 : sLeft * 0x7FFF;

      const sRight = Math.max(-1, Math.min(1, rightData[i]));
      rightInt16[i] = sRight < 0 ? sRight * 0x8000 : sRight * 0x7FFF;
    }

    const mp3Chunks: Uint8Array[] = [];
    const sampleBlockSize = 1152;

    for (let i = 0; i < numFrames; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }
    }

    const end = encoder.flush();
    if (end.length > 0) {
      mp3Chunks.push(new Uint8Array(end));
    }

    return new Blob(mp3Chunks as BlobPart[], { type: 'audio/mp3' });
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
