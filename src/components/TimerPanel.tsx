import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import './TimerPanel.css';

export function TimerPanel() {
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);

  const masterVolume = useAppStore((s) => s.masterVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);

  const earBalance = useAppStore((s) => s.earBalance);
  const setEarBalance = useAppStore((s) => s.setEarBalance);

  // Convert stored seconds to minutes for slider & inputs (up to 180 min / 3 hours)
  const durationMinutes = Math.round(timerDuration / 60);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="timer-panel">

      {/* Session Duration row (Max 3 hours / 180 min) */}
      <div className="control-row session-duration-row">
        <label htmlFor="timer-duration">Duration (min)</label>
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

      {/* Main Volume */}
      <div className="control-row master-volume-row">
        <label htmlFor="vol-master">Main Volume (%)</label>
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
            ariaLabel="Main volume percentage. Type numerical value and press Enter."
          />
        </div>
      </div>

      {/* Ear Balance Slider (Combined Left/Right, centered at 50% by default) */}
      <div className="control-row ear-balance-row">
        <div className="ear-balance-label-row">
          <label htmlFor="ear-balance">Balance (%)</label>
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
