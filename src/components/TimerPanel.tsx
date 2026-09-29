import { useAppStore } from '../store/useAppStore.ts';
import './TimerPanel.css';

/** Format seconds as mm:ss. */
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerPanel() {
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const fadeIn = useAppStore((s) => s.fadeInSeconds);
  const fadeOut = useAppStore((s) => s.fadeOutSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);
  const setFadeIn = useAppStore((s) => s.setFadeIn);
  const setFadeOut = useAppStore((s) => s.setFadeOut);

  // Convert stored seconds to minutes for the input
  const durationMinutes = timerDuration / 60;

  return (
    <div className="timer-panel">
      {/* Countdown display */}
      <div className="countdown" aria-live="polite" aria-label="Time remaining">
        {timerState.isRunning
          ? formatTime(timerState.remainingSeconds)
          : timerDuration > 0
            ? formatTime(timerDuration)
            : '--:--'}
      </div>

      {/* Duration */}
      <div className="control-row">
        <label htmlFor="timer-duration">Session Duration</label>
        <div className="slider-group">
          <input
            id="timer-duration"
            type="range"
            min={0}
            max={120}
            step={1}
            value={durationMinutes}
            onChange={(e) => setTimerDuration(Number(e.target.value) * 60)}
          />
          <span className="value-badge">
            {durationMinutes > 0 ? `${durationMinutes} min` : 'Off'}
          </span>
        </div>
      </div>

      {/* Fade-in */}
      <div className="control-row">
        <label htmlFor="fade-in">Fade In</label>
        <div className="slider-group">
          <input
            id="fade-in"
            type="range"
            min={0}
            max={30}
            step={1}
            value={fadeIn}
            onChange={(e) => setFadeIn(Number(e.target.value))}
          />
          <span className="value-badge">
            {fadeIn > 0 ? `${fadeIn}s` : 'Off'}
          </span>
        </div>
      </div>

      {/* Fade-out */}
      <div className="control-row">
        <label htmlFor="fade-out">Fade Out</label>
        <div className="slider-group">
          <input
            id="fade-out"
            type="range"
            min={0}
            max={30}
            step={1}
            value={fadeOut}
            onChange={(e) => setFadeOut(Number(e.target.value))}
          />
          <span className="value-badge">
            {fadeOut > 0 ? `${fadeOut}s` : 'Off'}
          </span>
        </div>
      </div>
    </div>
  );
}
