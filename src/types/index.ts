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
  /** Human-readable label (e.g. "Rain", "White"). */
  label: string;
  /** Group heading in the dropdown. */
  group: 'nature' | 'noise';
}

/** Represents an active ambient sound layer with its own volume control. */
export interface AmbientLayer {
  /** Unique instance identifier for this layer (e.g. 'layer-1'). */
  id: string;
  /** Ambient sound ID (e.g. 'rain', 'pink-noise', 'black-noise', or null for None). */
  soundId: string | null;
  /** Layer volume (0–1). */
  volume: number;
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

export type ExportFormat = 'wav' | 'mp3-320' | 'mp3-192';

export type ExportStatus = 'idle' | 'rendering' | 'encoding' | 'done' | 'error';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

// ── Interval Audio Layer ──

export type IntervalTone = 'bell' | 'chime' | 'beep' | 'waves';

export interface IntervalConfig {
  /** Whether the interval tone layer is enabled */
  enabled: boolean;
  /** Selected interval tone: 'bell' | 'chime' | 'beep' | 'waves' */
  tone: IntervalTone;
  /** Interval in minutes (5 to 90 in 5-min increments) */
  intervalMinutes: number;
  /** Volume of the interval tone layer (0 to 1) */
  volume: number;
  /** Number of times the interval tone plays (1 to 5, default 3) */
  repeatCount: number;
}
