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
  const fadeIn = useAppStore((s) => s.fadeInSeconds);
  const fadeOut = useAppStore((s) => s.fadeOutSeconds);
  const timerState = useAppStore((s) => s.timerState);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);
  const setFadeIn = useAppStore((s) => s.setFadeIn);
  const setFadeOut = useAppStore((s) => s.setFadeOut);

  // Convert stored seconds to minutes for slider & inputs
  const durationMinutes = Math.round(timerDuration / 60);

  const parseSecondsOrOff = (str: string) => {
    if (str.toLowerCase().includes('off') || str.trim() === '0') return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? null : num;
  };

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

      {/* Session Duration (10m slider steps, any typed minute value with Enter) */}
      <div className="control-row">
        <label htmlFor="timer-duration">Session Duration</label>
        <div className="slider-group">
          <input
            id="timer-duration"
            type="range"
            min={0}
            max={120}
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
            ariaLabel="Session duration in minutes. Type value and press Enter."
          />
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
          <CommitInput
            value={fadeIn}
            min={0}
            max={30}
            formatDisplay={(sec) => (sec > 0 ? `${sec}s` : 'Off')}
            parseInput={parseSecondsOrOff}
            onCommit={(sec) => setFadeIn(sec)}
            ariaLabel="Fade in duration in seconds. Type value and press Enter."
          />
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
          <CommitInput
            value={fadeOut}
            min={0}
            max={30}
            formatDisplay={(sec) => (sec > 0 ? `${sec}s` : 'Off')}
            parseInput={parseSecondsOrOff}
            onCommit={(sec) => setFadeOut(sec)}
            ariaLabel="Fade out duration in seconds. Type value and press Enter."
          />
        </div>
      </div>
    </div>
  );
}
