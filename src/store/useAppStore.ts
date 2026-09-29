import { create } from 'zustand';
import type {
  ExportStatus,
  PlaybackState,
  TimerState,
} from '../types';

// ── Store shape ──

export interface AppState {
  // Transport
  playback: PlaybackState;
  play: () => void;
  stop: () => void;

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

  // Ambient sound (single selection)
  selectedAmbientId: string | null;
  ambientVolume: number;
  setSelectedAmbient: (id: string | null) => void;
  setAmbientVolume: (v: number) => void;

  // Export
  exportStatus: ExportStatus;
  setExportStatus: (status: ExportStatus) => void;
}

// ── Store ──

export const useAppStore = create<AppState>((set) => ({
  // Transport
  playback: 'stopped',
  play: () => set({ playback: 'playing' }),
  stop: () => set({ playback: 'stopped' }),

  // Frequencies (sensible defaults)
  carrierFrequency: 200,
  beatFrequency: 10,
  setCarrierFrequency: (hz) => set({ carrierFrequency: hz }),
  setBeatFrequency: (hz) => set({ beatFrequency: hz }),

  // Volumes
  masterVolume: 0.5,
  leftVolume: 1,
  rightVolume: 1,
  setMasterVolume: (v) => set({ masterVolume: v }),
  setLeftVolume: (v) => set({ leftVolume: v }),
  setRightVolume: (v) => set({ rightVolume: v }),

  // Timer & fades
  timerDurationSeconds: 0,
  fadeInSeconds: 3,
  fadeOutSeconds: 3,
  timerState: { remainingSeconds: 0, isRunning: false },
  setTimerDuration: (s) => set({ timerDurationSeconds: s }),
  setFadeIn: (s) => set({ fadeInSeconds: s }),
  setFadeOut: (s) => set({ fadeOutSeconds: s }),
  updateTimerState: (partial) =>
    set((state) => ({ timerState: { ...state.timerState, ...partial } })),

  // Ambient sound
  selectedAmbientId: null,
  ambientVolume: 0.5,
  setSelectedAmbient: (id) => set({ selectedAmbientId: id }),
  setAmbientVolume: (v) => set({ ambientVolume: v }),

  // Export
  exportStatus: 'idle',
  setExportStatus: (status) => set({ exportStatus: status }),
}));
