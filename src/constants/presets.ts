import type { AmbientLayer, ExportFormat, IntervalTone } from '../types/index.ts';

export interface PresetDefinition {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  binauralEnabled: boolean;
  binauralVolume: number;
  carrierFrequency: number;
  beatFrequency: number;
  masterVolume: number;
  leftVolume: number;
  rightVolume: number;
  timerDurationSeconds: number;
  ambientEnabled: boolean;
  ambientLayers: AmbientLayer[];
  intervalEnabled: boolean;
  intervalTone: IntervalTone;
  intervalMinutes: number;
  intervalVolume: number;
  intervalRepeatCount: number;
  exportFormat: ExportFormat;
}

export const PRESETS: PresetDefinition[] = [
  {
    id: 'obe',
    name: 'OBE',
    tagline: 'Out of Body Experience',
    badge: '4.0 Hz Theta • 150 Hz • 90m',
    binauralEnabled: true,
    binauralVolume: 0.5,
    carrierFrequency: 150,
    beatFrequency: 4.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 90 * 60,
    ambientEnabled: false,
    ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    intervalEnabled: false,
    intervalTone: 'bell',
    intervalMinutes: 15,
    intervalVolume: 0.5,
    intervalRepeatCount: 3,
    exportFormat: 'wav',
  },
  {
    id: 'wbtb',
    name: 'WBTB',
    tagline: 'Wake Back To Bed Lucid State',
    badge: '6.0 Hz Theta • 250 Hz • 25m',
    binauralEnabled: true,
    binauralVolume: 0.5,
    carrierFrequency: 250,
    beatFrequency: 6.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 25 * 60,
    ambientEnabled: false,
    ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    intervalEnabled: false,
    intervalTone: 'bell',
    intervalMinutes: 15,
    intervalVolume: 0.5,
    intervalRepeatCount: 3,
    exportFormat: 'wav',
  },
  {
    id: 'meditation',
    name: 'Meditation',
    tagline: 'Theta Relaxation & Rain',
    badge: '6.0 Hz Theta • 250 Hz • Nature • 30m',
    binauralEnabled: true,
    binauralVolume: 0.5,
    carrierFrequency: 250,
    beatFrequency: 6.0,
    masterVolume: 0.5,
    leftVolume: 1.0,
    rightVolume: 1.0,
    timerDurationSeconds: 30 * 60,
    ambientEnabled: true,
    ambientLayers: [{ id: 'layer-1', soundId: 'rain', volume: 0.5 }],
    intervalEnabled: false,
    intervalTone: 'bell',
    intervalMinutes: 15,
    intervalVolume: 0.5,
    intervalRepeatCount: 3,
    exportFormat: 'wav',
  },
  {
    id: 'protocol-2',
    name: 'Protocol 2',
    tagline: 'Deep Rest & Brown Noise',
    badge: 'Brown Noise • 3h • 90m Beep (5×) • MP3',
    binauralEnabled: false, // no binaural beat
    binauralVolume: 0.5,
    carrierFrequency: 150,
    beatFrequency: 4.0,
    masterVolume: 0.5,
    leftVolume: 0,
    rightVolume: 0,
    timerDurationSeconds: 180 * 60, // 3 hours
    ambientEnabled: true, // only brown noise
    ambientLayers: [{ id: 'layer-1', soundId: 'brown-noise', volume: 0.6 }],
    intervalEnabled: true,
    intervalTone: 'beep', // double beep
    intervalMinutes: 90, // each 90 mins
    intervalVolume: 0.5,
    intervalRepeatCount: 5,
    exportFormat: 'mp3-192', // mp3 192 good
  },
];
