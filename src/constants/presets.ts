import type { AmbientLayer, ExportFormat, IntervalTone } from '../types/index.ts';

export interface PresetDefinition {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  carrierFrequency: number;
  beatFrequency: number;
  masterVolume: number;
  leftVolume: number;
  rightVolume: number;
  timerDurationSeconds: number;
  ambientLayers: AmbientLayer[];
  intervalTone: IntervalTone;
  intervalMinutes: number;
  intervalVolume: number;
  exportFormat: ExportFormat;
}

export const PRESETS: PresetDefinition[] = [
  {
    id: 'obe',
    name: 'OBE',
    tagline: 'Out of Body Experience',
    badge: '4.0 Hz Theta • 150 Hz • 90m',
    carrierFrequency: 150,
    beatFrequency: 4.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 90 * 60,
    ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    intervalTone: 'bell',
    intervalMinutes: 0,
    intervalVolume: 0.5,
    exportFormat: 'wav',
  },
  {
    id: 'protocol-2',
    name: 'Protocol 2',
    tagline: 'Deep Rest & Brown Noise',
    badge: 'Brown Noise • 3h • 90m Bounce • MP3',
    carrierFrequency: 150,
    beatFrequency: 4.0,
    masterVolume: 0.5,
    leftVolume: 0, // no binaural beat
    rightVolume: 0,
    timerDurationSeconds: 180 * 60, // 3 hours
    ambientLayers: [{ id: 'layer-1', soundId: 'brown-noise', volume: 0.6 }],
    intervalTone: 'bounce', // bounce is default for Protocol 2
    intervalMinutes: 90, // each 90 mins
    intervalVolume: 0.5,
    exportFormat: 'mp3-192', // mp3 192 good
  },
  {
    id: 'wbtb',
    name: 'WBTB',
    tagline: 'Wake Back To Bed Lucid State',
    badge: '6.0 Hz Theta • 250 Hz • 30m',
    carrierFrequency: 250,
    beatFrequency: 6.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 30 * 60,
    ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    intervalTone: 'bell',
    intervalMinutes: 0,
    intervalVolume: 0.5,
    exportFormat: 'wav',
  },
  {
    id: 'meditation',
    name: 'Meditation',
    tagline: 'Theta Relaxation & Rain',
    badge: '6.0 Hz Theta • 250 Hz • Rain • 30m',
    carrierFrequency: 250,
    beatFrequency: 6.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 30 * 60,
    ambientLayers: [{ id: 'layer-1', soundId: 'rain', volume: 0.5 }],
    intervalTone: 'bell',
    intervalMinutes: 0,
    intervalVolume: 0.5,
    exportFormat: 'wav',
  },
];
