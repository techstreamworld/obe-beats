import { create } from 'zustand';
import type {
  AmbientLayer,
  ExportStatus,
  PlaybackState,
  TimerState,
} from '../types';

// ── Default State Values ──

const DEFAULT_STATE = {
  playback: 'stopped' as PlaybackState,
  restartKey: 0,
  carrierFrequency: 200,
  beatFrequency: 3,
  masterVolume: 0.5,
  leftVolume: 1,
  rightVolume: 1,
  timerDurationSeconds: 0,
  fadeInSeconds: 3,
  fadeOutSeconds: 3,
  timerState: { remainingSeconds: 0, isRunning: false },
  ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }] as AmbientLayer[],
  exportStatus: 'idle' as ExportStatus,
};

// ── Store shape ──

export interface AppState {
  // Transport
  playback: PlaybackState;
  restartKey: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  resetAll: () => void;

  // Frequencies
  carrierFrequency: number;
  beatFrequency: number;
  setCarrierFrequency: (hz: number) => void;
  setBeatFrequency: (hz: number) => void;

  // Volumes
  masterVolume: number;
  leftVolume: number;
  rightVolume: number;
  setMasterVolume: (v: number) => void;
  setLeftVolume: (v: number) => void;
  setRightVolume: (v: number) => void;

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
  ambientLayers: AmbientLayer[];
  setAmbientLayerSound: (layerId: string, soundId: string | null) => void;
  setAmbientLayerVolume: (layerId: string, volume: number) => void;
  addAmbientLayer: () => void;
  removeAmbientLayer: (layerId: string) => void;

  // Legacy ambient compatibility
  selectedAmbientId: string | null;
  ambientVolume: number;
  setSelectedAmbient: (id: string | null) => void;
  setAmbientVolume: (v: number) => void;

  // Export
  exportStatus: ExportStatus;
  setExportStatus: (status: ExportStatus) => void;
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

  // Transport actions
  play: () => set({ playback: 'playing' }),
  pause: () => set({ playback: 'paused' }),
  stop: () => set({ playback: 'stopped' }),
  restart: () => set((state) => ({ playback: 'playing', restartKey: state.restartKey + 1 })),
  resetAll: () => set({ ...DEFAULT_STATE, ambientLayers: [{ id: 'layer-1', soundId: null, volume: 0.5 }] }),

  // Frequencies
  setCarrierFrequency: (hz) => set({ carrierFrequency: hz }),
  setBeatFrequency: (hz) => set({ beatFrequency: hz }),

  // Volumes
  setMasterVolume: (v) => set({ masterVolume: v }),
  setLeftVolume: (v) => set({ leftVolume: v }),
  setRightVolume: (v) => set({ rightVolume: v }),

  // Timer & fades
  setTimerDuration: (s) => set({ timerDurationSeconds: s }),
  setFadeIn: (s) => set({ fadeInSeconds: s }),
  setFadeOut: (s) => set({ fadeOutSeconds: s }),
  updateTimerState: (partial) =>
    set((state) => ({ timerState: { ...state.timerState, ...partial } })),

  // Ambient sound multi-layer actions
  setAmbientLayerSound: (layerId: string, soundId: string | null) =>
    set((state) => ({
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
      ambientLayers:
        state.ambientLayers.length > 1
          ? state.ambientLayers.filter((l) => l.id !== layerId)
          : [{ id: 'layer-1', soundId: null, volume: 0.5 }],
    })),

  // Legacy ambient compatibility
  setSelectedAmbient: (id: string | null) =>
    set((state) => ({
      ambientLayers: state.ambientLayers.length > 0
        ? [{ ...state.ambientLayers[0], soundId: id }, ...state.ambientLayers.slice(1)]
        : [{ id: 'layer-1', soundId: id, volume: 0.5 }],
    })),
  setAmbientVolume: (v: number) =>
    set((state) => ({
      ambientLayers: state.ambientLayers.map((l, i) => (i === 0 ? { ...l, volume: v } : l)),
    })),

  // Export
  setExportStatus: (status) => set({ exportStatus: status }),
}));
