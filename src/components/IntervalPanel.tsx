import { AudioEngine } from '../audio/AudioEngine.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import type { IntervalTone } from '../types/index.ts';
import './IntervalPanel.css';

const PRESET_INTERVALS = [0, 5, 10, 15, 20, 30, 45, 60, 90];

const TONE_OPTIONS: { id: IntervalTone; label: string; icon: string }[] = [
  { id: 'bell',  label: 'Bell',  icon: '🔔' },
  { id: 'chime', label: 'Chime', icon: '✨' },
  { id: 'beep',  label: 'Beep',  icon: '📟' },
];

export function IntervalPanel() {
  const intervalMinutes = useAppStore((s) => s.intervalMinutes);
  const intervalTone = useAppStore((s) => s.intervalTone);
  const intervalVolume = useAppStore((s) => s.intervalVolume);
  const isIntervalPreviewing = useAppStore((s) => s.isIntervalPreviewing);

  const setIntervalMinutes = useAppStore((s) => s.setIntervalMinutes);
  const setIntervalTone = useAppStore((s) => s.setIntervalTone);
  const setIntervalVolume = useAppStore((s) => s.setIntervalVolume);
  const setIsIntervalPreviewing = useAppStore((s) => s.setIsIntervalPreviewing);

  const parseMinutesOrOff = (str: string) => {
    if (str.toLowerCase().includes('off') || str.trim() === '0') return 0;
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return null;
    // Snap to nearest 5 minutes up to 90
    const clamped = Math.max(0, Math.min(90, num));
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
      await AudioEngine.getInstance().previewInterval(intervalTone, intervalVolume);
    }
  };

  return (
    <div className="interval-panel">
      {/* Interval duration row (5 min increments up to 90 min) */}
      <div className="control-row">
        <div className="interval-header">
          <label htmlFor="interval-slider">Interval Tone Timer</label>
          <span className="interval-badge">
            {intervalMinutes > 0 ? `Every ${intervalMinutes} min` : 'Disabled'}
          </span>
        </div>
        <div className="slider-group">
          <input
            id="interval-slider"
            type="range"
            min={0}
            max={90}
            step={5}
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          />
          <CommitInput
            value={intervalMinutes}
            min={0}
            max={90}
            step={5}
            formatDisplay={(min) => (min > 0 ? `${min} min` : 'Off')}
            parseInput={parseMinutesOrOff}
            onCommit={(min) => setIntervalMinutes(min)}
            ariaLabel="Interval duration in minutes (5 to 90 min, 0 = Off). Type value and press Enter."
          />
        </div>

        {/* Quick interval presets */}
        <div className="interval-presets" role="group" aria-label="Interval presets">
          {PRESET_INTERVALS.map((min) => (
            <button
              key={min}
              type="button"
              className={`preset-chip ${intervalMinutes === min ? 'active' : ''}`}
              onClick={() => setIntervalMinutes(min)}
            >
              {min === 0 ? 'Off' : `${min}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Selection (Bell, Chime, Beep) */}
      <div className="control-row">
        <label>Interval Tone</label>
        <div className="tone-selector" role="radiogroup" aria-label="Interval tone selection">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={intervalTone === opt.id}
              className={`tone-btn ${intervalTone === opt.id ? 'active' : ''}`}
              onClick={() => setIntervalTone(opt.id)}
            >
              <span className="tone-icon">{opt.icon}</span>
              <span className="tone-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interval Volume & Preview */}
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
            ariaLabel="Interval layer volume percentage. Type value and press Enter."
          />
        </div>
      </div>

      {/* Preview trigger button */}
      <div className="interval-footer">
        <button
          type="button"
          className={`interval-preview-btn ${isIntervalPreviewing ? 'active' : ''}`}
          onClick={handleTogglePreview}
          title="Play 3 strikes with a 2-second pause, getting progressively louder"
        >
          {isIntervalPreviewing ? '⏹ Stop Preview' : '▶ Preview Interval (3x)'}
        </button>
        <span className="interval-hint">
          Repeats 3× with 2s pause, progressively louder
        </span>
      </div>
    </div>
  );
}
