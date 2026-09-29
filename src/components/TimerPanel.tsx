import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import './TimerPanel.css';

/** Format seconds as mm:ss. */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerPanel() {
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);

  // Convert stored seconds to minutes for slider & inputs (up to 180 min / 3 hours)
  const durationMinutes = Math.round(timerDuration / 60);

  const parseSecondsOrOff = (str: string) => {
    if (str.toLowerCase().includes('off') || str.trim() === '0') return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? null : num;
  };

  return (
    <div className="timer-panel">
      {/* Countdown and Session Duration row (Max 3 hours / 180 min) */}
      <div className="timer-header-row">
        <div className="countdown" aria-live="polite" aria-label="Time remaining">
          {timerState.isRunning
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
              step={10}
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
    </div>
  );
}
