import { create } from 'zustand';
import { PRESETS } from '../constants/presets.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import type {
  AmbientLayer,
  ExportFormat,
  ExportStatus,
  IntervalTone,
  PlaybackState,
  TimerState,
} from '../types';

// ── Default State Values ──

/** Converts 0-100 ear balance (0 = Left, 50 = Center, 100 = Right) to { leftVolume, rightVolume } */
export function balanceToVolumes(balance: number): { leftVolume: number; rightVolume: number } {
  const clamped = Math.max(0, Math.min(100, balance));
  if (clamped <= 50) {
    return {
      leftVolume: 1.0,
      rightVolume: Math.round((clamped / 50) * 100) / 100,
    };
  } else {
    return {
      leftVolume: Math.round(((100 - clamped) / 50) * 100) / 100,
      rightVolume: 1.0,
    };
  }
}

/** Converts left/right volumes back to 0-100 ear balance */
export function volumesToBalance(left: number, right: number): number {
  if (left >= 0.999 && right >= 0.999) return 50;
  if (left >= 0.999) {
    return Math.round(right * 50);
  }
  if (right >= 0.999) {
    return Math.round(100 - left * 50);
  }
  const total = left + right;
  if (total <= 0) return 50;
  return Math.round((right / total) * 100);
}

const DEFAULT_STATE = {
  playback: 'stopped' as PlaybackState,
  restartKey: 0,
  binauralEnabled: true,
  binauralVolume: 0.5,
  carrierFrequency: 150,
  beatFrequency: 3,
  masterVolume: 0.5,
  leftVolume: 1,
  rightVolume: 1,
  earBalance: 50,
  timerDurationSeconds: 90 * 60,
  fadeInSeconds: 3,
  fadeOutSeconds: 3,
  timerState: { remainingSeconds: 90 * 60, isRunning: false },
  ambientEnabled: false,
  ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }] as AmbientLayer[],
  intervalEnabled: false,
  intervalTone: 'bell' as IntervalTone,
  intervalMinutes: 15,
  intervalVolume: 0.5,
  intervalRepeatCount: 3,
  isIntervalPreviewing: false,
  exportFormat: 'wav' as ExportFormat,
  exportStatus: 'idle' as ExportStatus,
  activePresetId: null as string | null,
  seekRequest: null as { elapsedSeconds: number; key: number } | null,
  uploadEnabled: false,
  uploadVolume: 0.5,
};

// ── Store shape ──

export interface AppState {
  // Transport
  playback: PlaybackState;
  restartKey: number;
  seekRequest: { elapsedSeconds: number; key: number } | null;
  seek: (elapsedSeconds: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  resetAll: () => void;

  // Presets
  activePresetId: string | null;
  applyPreset: (presetId: string) => void;

  // Binaural Beats & Frequencies
  binauralEnabled: boolean;
  setBinauralEnabled: (enabled: boolean) => void;
  binauralVolume: number;
  setBinauralVolume: (v: number) => void;
  carrierFrequency: number;
  beatFrequency: number;
  setCarrierFrequency: (hz: number) => void;
  setBeatFrequency: (hz: number) => void;

  // Volumes
  masterVolume: number;
  leftVolume: number;
  rightVolume: number;
  earBalance: number;
  setMasterVolume: (v: number) => void;
  setLeftVolume: (v: number) => void;
  setRightVolume: (v: number) => void;
  setEarBalance: (balance: number) => void;

  // Timer & fades
  timerDurationSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  timerState: TimerState;
  setTimerDuration: (s: number) => void;
  setFadeIn: (s: number) => void;
  setFadeOut: (s: number) => void;
  updateTimerState: (state: Partial<TimerState>) => void;

  // Ambient sound layers (multi-layer support)
  ambientEnabled: boolean;
  setAmbientEnabled: (enabled: boolean) => void;
  ambientLayers: AmbientLayer[];
  setAmbientLayerSound: (layerId: string, soundId: string | null) => void;
  setAmbientLayerVolume: (layerId: string, volume: number) => void;
  addAmbientLayer: () => void;
  removeAmbientLayer: (layerId: string) => void;

  // Interval Audio Layer
  intervalEnabled: boolean;
  intervalTone: IntervalTone;
  intervalMinutes: number;
  intervalVolume: number;
  intervalRepeatCount: number;
  isIntervalPreviewing: boolean;
  setIntervalEnabled: (enabled: boolean) => void;
  setIntervalTone: (tone: IntervalTone) => void;
  setIntervalMinutes: (minutes: number) => void;
  setIntervalVolume: (v: number) => void;
  setIntervalRepeatCount: (count: number) => void;
  setIsIntervalPreviewing: (previewing: boolean) => void;

  // Legacy ambient compatibility
  selectedAmbientId: string | null;
  ambientVolume: number;
  setSelectedAmbient: (id: string | null) => void;
  setAmbientVolume: (v: number) => void;

  // Export
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  exportStatus: ExportStatus;
  setExportStatus: (status: ExportStatus) => void;

  // Upload
  uploadEnabled: boolean;
  setUploadEnabled: (enabled: boolean) => void;
  uploadVolume: number;
  setUploadVolume: (v: number) => void;
}

// ── Store ──

export const useAppStore = create<AppState>((set, get) => ({
  ...DEFAULT_STATE,

  // Legacy getters
  get selectedAmbientId() {
    return get().ambientLayers[0]?.soundId ?? null;
  },
  get ambientVolume() {
    return get().ambientLayers[0]?.volume ?? 0.5;
  },

  // Presets action
  applyPreset: (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // The meditation preset will now choose a different random ambient nature sound each time it's clicked
    let ambientLayers = preset.ambientLayers;
    if (preset.id === 'meditation') {
      const NATURE_SOUNDS = ['rain', 'ocean-waves', 'river', 'fireplace', 'deep-sea'];
      const currentSound = get().ambientLayers[0]?.soundId;
      const candidates = NATURE_SOUNDS.filter((s) => s !== currentSound);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || NATURE_SOUNDS[0];
      ambientLayers = [{ id: 'layer-1', soundId: chosen, volume: 0.5 }];
    }

    set((state) => ({
      playback: 'playing',
      restartKey: state.restartKey + 1,
      activePresetId: preset.id,
      binauralEnabled: preset.binauralEnabled,
      binauralVolume: preset.binauralVolume ?? 0.5,
      carrierFrequency: preset.carrierFrequency,
      beatFrequency: preset.beatFrequency,
      masterVolume: preset.masterVolume,
      leftVolume: preset.leftVolume,
      rightVolume: preset.rightVolume,
      earBalance: volumesToBalance(preset.leftVolume, preset.rightVolume),
      timerDurationSeconds: preset.timerDurationSeconds,
      timerState: {
        remainingSeconds: preset.timerDurationSeconds,
        isRunning: true,
      },
      ambientEnabled: preset.ambientEnabled,
      ambientLayers,
      intervalEnabled: preset.intervalEnabled,
      intervalTone: preset.intervalTone,
      intervalMinutes: preset.intervalMinutes,
      intervalVolume: preset.intervalVolume,
      intervalRepeatCount: preset.intervalRepeatCount ?? 3,
      exportFormat: preset.exportFormat,
    }));
  },

  // Transport actions
  play: () => set({ playback: 'playing' }),
  pause: () => set({ playback: 'paused' }),
  stop: () => set({ playback: 'stopped' }),
  restart: () => set((state) => ({ playback: 'playing', restartKey: state.restartKey + 1 })),
  seek: (elapsedSeconds: number) =>
    set({
      seekRequest: { elapsedSeconds, key: Date.now() + Math.random() },
    }),
  resetAll: () => {
    AudioEngine.getInstance().resetDefaults();
    set({
      ...DEFAULT_STATE,
      playback: 'stopped',
      binauralEnabled: true,
      binauralVolume: 0.5,
      carrierFrequency: 150,
      beatFrequency: 3,
      masterVolume: 0.5,
      leftVolume: 1,
      rightVolume: 1,
      earBalance: 50,
      timerDurationSeconds: 90 * 60,
      timerState: { remainingSeconds: 90 * 60, isRunning: false },
      ambientEnabled: false,
      ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }],
      intervalEnabled: false,
      intervalTone: 'bell',
      intervalMinutes: 15,
      intervalVolume: 0.5,
      intervalRepeatCount: 3,
      isIntervalPreviewing: false,
      exportFormat: 'wav',
      exportStatus: 'idle',
      activePresetId: null,
      uploadEnabled: false,
      uploadVolume: 0.5,
    });
  },

  // Binaural Beats & Frequencies
  setBinauralEnabled: (enabled) => set({ binauralEnabled: enabled, activePresetId: null }),
  setBinauralVolume: (v) => set({ binauralVolume: v, activePresetId: null }),
  setCarrierFrequency: (hz) => set({ carrierFrequency: hz, activePresetId: null }),
  setBeatFrequency: (hz) => set({ beatFrequency: hz, activePresetId: null }),

  // Volumes
  setMasterVolume: (v) => set({ masterVolume: v }),
  setLeftVolume: (v) =>
    set((state) => ({
      leftVolume: v,
      earBalance: volumesToBalance(v, state.rightVolume),
      activePresetId: null,
    })),
  setRightVolume: (v) =>
    set((state) => ({
      rightVolume: v,
      earBalance: volumesToBalance(state.leftVolume, v),
      activePresetId: null,
    })),
  setEarBalance: (balance: number) => {
    const clamped = Math.max(0, Math.min(100, balance));
    const { leftVolume, rightVolume } = balanceToVolumes(clamped);
    set({
      earBalance: clamped,
      leftVolume,
      rightVolume,
      activePresetId: null,
    });
  },

  // Timer & fades
  setTimerDuration: (s) =>
    set((state) => ({
      timerDurationSeconds: s,
      activePresetId: null,
      timerState:
        state.playback === 'stopped'
          ? { remainingSeconds: s, isRunning: false }
          : state.timerState,
    })),
  setFadeIn: (s) => set({ fadeInSeconds: s }),
  setFadeOut: (s) => set({ fadeOutSeconds: s }),
  updateTimerState: (partial) =>
    set((state) => ({ timerState: { ...state.timerState, ...partial } })),

  // Ambient sound multi-layer actions
  setAmbientEnabled: (enabled) => set({ ambientEnabled: enabled, activePresetId: null }),
  setAmbientLayerSound: (layerId: string, soundId: string | null) =>
    set((state) => ({
      activePresetId: null,
      ambientLayers: state.ambientLayers.map((l) =>
        l.id === layerId ? { ...l, soundId } : l,
      ),
    })),
  setAmbientLayerVolume: (layerId: string, volume: number) =>
    set((state) => ({
      ambientLayers: state.ambientLayers.map((l) =>
        l.id === layerId ? { ...l, volume } : l,
      ),
    })),
  addAmbientLayer: () =>
    set((state) => ({
      activePresetId: null,
      ambientLayers: [
        ...state.ambientLayers,
        {
          id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          soundId: null,
          volume: 0.5,
        },
      ],
    })),
  removeAmbientLayer: (layerId: string) =>
    set((state) => ({
      activePresetId: null,
      ambientLayers:
        state.ambientLayers.length > 1
          ? state.ambientLayers.filter((l) => l.id !== layerId)
          : [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    })),

  // Interval Audio Layer actions
  setIntervalEnabled: (enabled) => set({ intervalEnabled: enabled, activePresetId: null }),
  setIntervalTone: (tone) => set({ intervalTone: tone, activePresetId: null }),
  setIntervalMinutes: (min) => set({ intervalMinutes: min, activePresetId: null }),
  setIntervalVolume: (v) => set({ intervalVolume: v }),
  setIntervalRepeatCount: (count) => set({ intervalRepeatCount: count, activePresetId: null }),
  setIsIntervalPreviewing: (previewing) => set({ isIntervalPreviewing: previewing }),

  // Legacy ambient compatibility
  setSelectedAmbient: (id: string | null) =>
    set((state) => ({
      activePresetId: null,
      ambientLayers: state.ambientLayers.length > 0
        ? [{ ...state.ambientLayers[0], soundId: id }, ...state.ambientLayers.slice(1)]
        : [{ id: 'layer-1', soundId: id, volume: 0.5 }],
    })),
  setAmbientVolume: (v: number) =>
    set((state) => ({
      ambientLayers: state.ambientLayers.map((l, i) => (i === 0 ? { ...l, volume: v } : l)),
    })),

  // Export
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportStatus: (status) => set({ exportStatus: status }),

  // Upload
  setUploadEnabled: (enabled) => set({ uploadEnabled: enabled, activePresetId: null }),
  setUploadVolume: (v) => set({ uploadVolume: v }),
}));
