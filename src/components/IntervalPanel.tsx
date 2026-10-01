import { AudioEngine } from '../audio/AudioEngine.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import type { IntervalTone } from '../types/index.ts';
import './IntervalPanel.css';

const TONE_OPTIONS: { id: IntervalTone; label: string }[] = [
  { id: 'bell',  label: 'Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'beep',  label: 'Beep' },
  { id: 'waves', label: 'Waves' },
];

const REPEAT_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3× (Default)' },
  { value: 4, label: '4×' },
  { value: 5, label: '5×' },
];

export function IntervalPanel() {
  const intervalEnabled = useAppStore((s) => s.intervalEnabled);
  const setIntervalEnabled = useAppStore((s) => s.setIntervalEnabled);
  const intervalMinutes = useAppStore((s) => s.intervalMinutes);
  const intervalTone = useAppStore((s) => s.intervalTone);
  const intervalVolume = useAppStore((s) => s.intervalVolume);
  const intervalRepeatCount = useAppStore((s) => s.intervalRepeatCount);
  const isIntervalPreviewing = useAppStore((s) => s.isIntervalPreviewing);

  const setIntervalMinutes = useAppStore((s) => s.setIntervalMinutes);
  const setIntervalTone = useAppStore((s) => s.setIntervalTone);
  const setIntervalVolume = useAppStore((s) => s.setIntervalVolume);
  const setIntervalRepeatCount = useAppStore((s) => s.setIntervalRepeatCount);
  const setIsIntervalPreviewing = useAppStore((s) => s.setIsIntervalPreviewing);

  const parseMinutes = (str: string) => {
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return null;
    const clamped = Math.max(5, Math.min(90, num));
    return Math.round(clamped / 5) * 5;
  };

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  const handleTogglePreview = async () => {
    if (isIntervalPreviewing) {
      AudioEngine.getInstance().stopIntervalPreview();
      setIsIntervalPreviewing(false);
    } else {
      setIsIntervalPreviewing(true);
      await AudioEngine.getInstance().previewInterval(intervalTone, intervalVolume, intervalRepeatCount);
    }
  };

  return (
    <div className="interval-panel">
      {/* Tick box header: when ticked it opens options, when unticked it hides them */}
      <div className="interval-toggle-row">
        <label className="interval-checkbox-label" htmlFor="interval-enabled-checkbox">
          <input
            id="interval-enabled-checkbox"
            type="checkbox"
            className="interval-checkbox"
            checked={intervalEnabled}
            onChange={(e) => setIntervalEnabled(e.target.checked)}
          />
          <span className="interval-checkbox-title">Interval Sound</span>
        </label>
      </div>

      {/* Interval options (revealed only when ticked) */}
      {intervalEnabled && (
        <div className="interval-options-container">
          {/* Sound selection dropdown (like Ambient Sound) */}
          <div className="control-row">
            <label htmlFor="interval-sound-select">Sound Effect</label>
            <select
              id="interval-sound-select"
              className="interval-select"
              value={intervalTone}
              onChange={(e) => setIntervalTone(e.target.value as IntervalTone)}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Repeat count selection dropdown */}
          <div className="control-row">
            <label htmlFor="interval-repeat-select">Repeats</label>
            <select
              id="interval-repeat-select"
              className="interval-select"
              value={intervalRepeatCount}
              onChange={(e) => setIntervalRepeatCount(Number(e.target.value))}
            >
              {REPEAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Interval duration row (5 min increments up to 90 min) */}
          <div className="control-row">
            <label htmlFor="interval-slider">Interval Timer</label>
            <div className="slider-group">
              <input
                id="interval-slider"
                type="range"
                min={5}
                max={90}
                step={5}
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              />
              <CommitInput
                value={intervalMinutes}
                min={5}
                max={90}
                step={5}
                formatDisplay={(min) => `${min} min`}
                parseInput={parseMinutes}
                onCommit={(min) => setIntervalMinutes(min)}
                ariaLabel="Interval duration in minutes (5 to 90 min). Type value and press Enter."
              />
            </div>
          </div>

          {/* Interval Volume */}
          <div className="control-row">
            <label htmlFor="interval-volume">Interval Volume</label>
            <div className="slider-group">
              <input
                id="interval-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={intervalVolume}
                onChange={(e) => setIntervalVolume(Number(e.target.value))}
              />
              <CommitInput
                value={intervalVolume}
                min={0}
                max={1}
                formatDisplay={(v) => `${Math.round(v * 100)}%`}
                parseInput={parsePercent}
                onCommit={(v) => setIntervalVolume(v)}
                ariaLabel="Interval volume percentage. Type value and press Enter."
              />
            </div>
          </div>

          {/* Preview trigger button */}
          <div className="interval-footer">
            <button
              type="button"
              className={`interval-preview-btn ${isIntervalPreviewing ? 'active' : ''}`}
              onClick={handleTogglePreview}
              title="Preview interval tone sequence"
            >
              {isIntervalPreviewing ? '⏹ Stop Preview' : `▶ Preview Interval (${intervalRepeatCount}×)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
