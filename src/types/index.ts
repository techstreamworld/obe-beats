// ─── Shared TypeScript types for OBE Beats ───

// ── Audio Engine ──

/** Parameters that fully describe the binaural-beat configuration. */
export interface EngineParams {
  /** Base / carrier frequency in Hz (20–1500). */
  carrierFrequency: number;
  /** Desired binaural-beat frequency in Hz (0.5–40). */
  beatFrequency: number;
  /** Master volume (0–1). */
  masterVolume: number;
  /** Left-ear volume (0–1). */
  leftVolume: number;
  /** Right-ear volume (0–1). */
  rightVolume: number;
}

/** Describes one entry in the ambient-sound catalogue. */
export interface AmbientSoundEntry {
  /** Unique identifier (e.g. 'rain', 'white-noise'). */
  id: string;
  /** Human-readable label (e.g. "Rain", "White Noise"). */
  label: string;
  /** Group heading in the dropdown. */
  group: 'nature' | 'noise';
}

// ── Timer & Fades ──

export interface TimerConfig {
  /** Session duration in seconds (0 = no timer). */
  durationSeconds: number;
  /** Fade-in duration in seconds. */
  fadeInSeconds: number;
  /** Fade-out duration in seconds. */
  fadeOutSeconds: number;
}

export interface TimerState {
  /** Seconds remaining in the current session. */
  remainingSeconds: number;
  /** Whether the timer is actively counting down. */
  isRunning: boolean;
}

// ── WAV Export ──

export interface ExportConfig {
  /** Duration of the exported file in seconds. */
  durationSeconds: number;
  /** Sample rate for the export (default 44100). */
  sampleRate: number;
}

export type ExportStatus = 'idle' | 'rendering' | 'encoding' | 'done' | 'error';

// ── UI / Transport ──

export type PlaybackState = 'stopped' | 'playing';
