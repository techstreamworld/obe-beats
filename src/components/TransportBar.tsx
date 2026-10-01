import { useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { useAppStore } from '../store/useAppStore.ts';
import './TransportBar.css';

/** Format seconds as mm:ss or h:mm:ss. */
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TransportBar() {
  const playback = useAppStore((s) => s.playback);
  const play = useAppStore((s) => s.play);
  const pause = useAppStore((s) => s.pause);
  const restart = useAppStore((s) => s.restart);
  const resetAll = useAppStore((s) => s.resetAll);
  const seek = useAppStore((s) => s.seek);

  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const intervalEnabled = useAppStore((s) => s.intervalEnabled);
  const intervalMinutes = useAppStore((s) => s.intervalMinutes);

  // Local scrub state for the playback seek bar
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const isPlaying = playback === 'playing';

  // Compute current elapsed playback seconds
  const elapsedSeconds =
    timerDuration > 0
      ? Math.max(0, timerDuration - timerState.remainingSeconds)
      : 0;

  const displayElapsed =
    isScrubbing && scrubValue !== null ? scrubValue : elapsedSeconds;

  // Compute interval marker timestamps in seconds
  const intervalMarkers: number[] = [];
  if (intervalEnabled && intervalMinutes > 0 && timerDuration > 0) {
    const step = intervalMinutes * 60;
    for (let t = step; t < timerDuration; t += step) {
      intervalMarkers.push(t);
    }
  }

  const handleSeekCommit = (val: number) => {
    seek(val);
    setIsScrubbing(false);
    setScrubValue(null);
  };

  const handleReset = () => {
    // Unconditionally and synchronously stop all live audio and reset internal state
    AudioEngine.getInstance().resetDefaults();
    resetAll();
  };

  return (
    <div className="transport-bar" role="toolbar" aria-label="Audio playback controls">
      {/* Play / Pause button */}
      <button
        type="button"
        className={`transport-btn btn-play-pause ${isPlaying ? 'is-playing' : ''}`}
        onClick={isPlaying ? pause : play}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        title={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        <span className="transport-icon" aria-hidden="true">
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
        <span className="transport-btn-label">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>

      {/* Playback Seek Bar next to Play button (on the same horizontal line with timestamps) */}
      {playback !== 'stopped' && timerDuration > 0 && (
        <div className="transport-playback-bar" aria-label="Playback progress and seeking">
          <div className="playback-slider-container">
            <input
              type="range"
              className="playback-slider"
              min={0}
              max={timerDuration}
              step={1}
              value={displayElapsed}
              onPointerDown={() => setIsScrubbing(true)}
              onChange={(e) => setScrubValue(Number(e.target.value))}
              onPointerUp={(e) =>
                handleSeekCommit(Number((e.target as HTMLInputElement).value))
              }
              onKeyUp={(e) =>
                handleSeekCommit(Number((e.target as HTMLInputElement).value))
              }
              aria-label="Seek session playback. Drag to jump to any time point."
            />
            {intervalEnabled && intervalMinutes > 0 && (
              <div className="interval-indicators-layer" aria-hidden="true">
                {intervalMarkers.map((sec) => (
                  <div
                    key={sec}
                    className="interval-bar-indicator"
                    style={{
                      left: `calc(9px + (100% - 18px) * ${sec / timerDuration})`,
                    }}
                    title={`Interval cue at ${formatTime(sec)}`}
                  />
                ))}
              </div>
            )}
          </div>
          <span className="playback-time-inline" aria-live="polite">
            {formatTime(displayElapsed)} / {formatTime(timerDuration)}
          </span>
        </div>
      )}

      {/* Restart button */}
      <button
        type="button"
        className="transport-btn btn-secondary btn-restart"
        onClick={restart}
        aria-label="Restart audio from beginning"
        title="Restart audio from beginning"
      >
        <span className="transport-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </span>
        <span className="transport-btn-label">Restart</span>
      </button>

      {/* Reset button */}
      <button
        type="button"
        className="transport-btn btn-secondary btn-reset"
        onClick={handleReset}
        aria-label="Reset all controls and settings to default"
        title="Reset all settings to default"
      >
        <span className="transport-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </span>
        <span className="transport-btn-label">Reset</span>
      </button>
    </div>
  );
}
