import { useState } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import './TimerPanel.css';

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

export function TimerPanel() {
  const playback = useAppStore((s) => s.playback);
  const seek = useAppStore((s) => s.seek);

  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);

  const masterVolume = useAppStore((s) => s.masterVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);

  const earBalance = useAppStore((s) => s.earBalance);
  const setEarBalance = useAppStore((s) => s.setEarBalance);

  const intervalEnabled = useAppStore((s) => s.intervalEnabled);
  const intervalMinutes = useAppStore((s) => s.intervalMinutes);

  // Local scrub state for the playback seek bar
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

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

  // Convert stored seconds to minutes for slider & inputs (up to 180 min / 3 hours)
  const durationMinutes = Math.round(timerDuration / 60);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  const handleSeekCommit = (val: number) => {
    seek(val);
    setIsScrubbing(false);
    setScrubValue(null);
  };

  return (
    <div className="timer-panel">
      {/* Playback Seek Bar — shown when audio plays/is active */}
      {playback !== 'stopped' && timerDuration > 0 && (
        <div className="playback-bar-section" aria-label="Playback Progress and Seeking">
          <div className="playback-bar-header">
            <span className="playback-bar-title">Session Playback</span>
            <span className="playback-bar-time" aria-live="polite">
              {formatTime(displayElapsed)} / {formatTime(timerDuration)}
            </span>
          </div>
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
                    title={`Interval indicator at ${formatTime(sec)}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Duration row (Max 3 hours / 180 min) */}
      <div className="control-row session-duration-row">
        <label htmlFor="timer-duration">Session Duration (min)</label>
        <div className="slider-group">
          <input
            id="timer-duration"
            type="range"
            min={0}
            max={180}
            step={5}
            value={durationMinutes}
            onChange={(e) => setTimerDuration(Number(e.target.value) * 60)}
          />
          <CommitInput
            value={durationMinutes}
            min={0}
            max={180}
            formatDisplay={(min) => `${min}`}
            parseInput={(str) => {
              const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
              return isNaN(num) ? null : num;
            }}
            onCommit={(min) => setTimerDuration(min * 60)}
            ariaLabel="Session duration in minutes (0 to 180 min). Type numerical value and press Enter."
          />
        </div>
      </div>

      {/* Master Volume */}
      <div className="control-row master-volume-row">
        <label htmlFor="vol-master">Master Volume (%)</label>
        <div className="slider-group">
          <input
            id="vol-master"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
          />
          <CommitInput
            value={masterVolume}
            min={0}
            max={1}
            formatDisplay={(v) => `${Math.round(v * 100)}`}
            parseInput={parsePercent}
            onCommit={(v) => setMasterVolume(v)}
            ariaLabel="Master volume percentage. Type numerical value and press Enter."
          />
        </div>
      </div>

      {/* Ear Balance Slider (Combined Left/Right, centered at 50% by default) */}
      <div className="control-row ear-balance-row">
        <div className="ear-balance-label-row">
          <label htmlFor="ear-balance">Ear Balance (%)</label>
          <span
            className="ear-balance-center-label"
            title="0 = Left, 50 = Center, 100 = Right. Double click slider to reset."
          >
            {earBalance === 50
              ? 'Center'
              : earBalance < 50
                ? `L ${Math.round((50 - earBalance) * 2)}%`
                : `R ${Math.round((earBalance - 50) * 2)}%`}
          </span>
        </div>
        <div className="slider-group">
          <input
            id="ear-balance"
            type="range"
            min={0}
            max={100}
            step={1}
            value={earBalance}
            onChange={(e) => setEarBalance(Number(e.target.value))}
            onDoubleClick={() => setEarBalance(50)}
            title="Ear balance (0 = Left, 50 = Center, 100 = Right). Double click to center."
          />
          <CommitInput
            value={earBalance}
            min={0}
            max={100}
            formatDisplay={(v) => `${Math.round(v)}`}
            parseInput={(str) => {
              const num = parseFloat(str.replace(/[^0-9.]/g, ''));
              return isNaN(num) ? null : Math.round(num);
            }}
            onCommit={(v) => setEarBalance(v)}
            ariaLabel="Ear balance percentage (0 = Left, 50 = Center, 100 = Right). Type numerical value and press Enter."
          />
        </div>
      </div>
    </div>
  );
}
