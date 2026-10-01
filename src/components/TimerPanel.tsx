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
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);

  const masterVolume = useAppStore((s) => s.masterVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);

  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const setLeftVolume = useAppStore((s) => s.setLeftVolume);
  const setRightVolume = useAppStore((s) => s.setRightVolume);

  // Convert stored seconds to minutes for slider & inputs (up to 180 min / 3 hours)
  const durationMinutes = Math.round(timerDuration / 60);

  const parseSecondsOrOff = (str: string) => {
    if (str.toLowerCase().includes('off') || str.trim() === '0') return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? null : num;
  };

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="timer-panel">
      {/* Countdown and Session Duration row (Max 3 hours / 180 min) */}
      <div className="timer-header-row">
        <div className="countdown" aria-live="polite" aria-label="Time remaining">
          {timerState.remainingSeconds > 0
            ? formatTime(timerState.remainingSeconds)
            : timerDuration > 0
              ? formatTime(timerDuration)
              : '--:--'}
        </div>

        <div className="control-row session-duration-row">
          <label htmlFor="timer-duration">Session Duration</label>
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
              formatDisplay={(min) => (min > 0 ? `${min} min` : 'Off')}
              parseInput={parseSecondsOrOff}
              onCommit={(min) => setTimerDuration(min * 60)}
              ariaLabel="Session duration in minutes (up to 180 min / 3 hours). Type value and press Enter."
            />
          </div>
        </div>
      </div>

      {/* Master Volume */}
      <div className="control-row master-volume-row">
        <label htmlFor="vol-master">Master Volume</label>
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
            formatDisplay={(v) => `${Math.round(v * 100)}%`}
            parseInput={parsePercent}
            onCommit={(v) => setMasterVolume(v)}
            ariaLabel="Master volume percentage. Type value and press Enter."
          />
        </div>
      </div>

      {/* Left Ear Volume */}
      <div className="control-row ear-volume-row">
        <label htmlFor="vol-left">Left Ear</label>
        <div className="slider-group">
          <input
            id="vol-left"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={leftVolume}
            onChange={(e) => setLeftVolume(Number(e.target.value))}
          />
          <CommitInput
            value={leftVolume}
            min={0}
            max={1}
            formatDisplay={(v) => `${Math.round(v * 100)}%`}
            parseInput={parsePercent}
            onCommit={(v) => setLeftVolume(v)}
            ariaLabel="Left ear volume percentage."
          />
        </div>
      </div>

      {/* Right Ear Volume */}
      <div className="control-row ear-volume-row">
        <label htmlFor="vol-right">Right Ear</label>
        <div className="slider-group">
          <input
            id="vol-right"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={rightVolume}
            onChange={(e) => setRightVolume(Number(e.target.value))}
          />
          <CommitInput
            value={rightVolume}
            min={0}
            max={1}
            formatDisplay={(v) => `${Math.round(v * 100)}%`}
            parseInput={parsePercent}
            onCommit={(v) => setRightVolume(v)}
            ariaLabel="Right ear volume percentage."
          />
        </div>
      </div>
    </div>
  );
}
