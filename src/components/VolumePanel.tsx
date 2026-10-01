import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import './VolumePanel.css';

export function VolumePanel() {
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);
  const setLeftVolume = useAppStore((s) => s.setLeftVolume);
  const setRightVolume = useAppStore((s) => s.setRightVolume);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="volume-panel">
      {/* Master Volume */}
      <div className="control-row">
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

      {/* Left and Right Ear side-by-side (half-size sliders) */}
      <div className="ear-balance-row">
        <div className="control-row ear-half">
          <label htmlFor="vol-left">Left Ear (%)</label>
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
              formatDisplay={(v) => `${Math.round(v * 100)}`}
              parseInput={parsePercent}
              onCommit={(v) => setLeftVolume(v)}
              ariaLabel="Left ear volume percentage. Type numerical value and press Enter."
            />
          </div>
        </div>

        <div className="control-row ear-half">
          <label htmlFor="vol-right">Right Ear (%)</label>
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
              formatDisplay={(v) => `${Math.round(v * 100)}`}
              parseInput={parsePercent}
              onCommit={(v) => setRightVolume(v)}
              ariaLabel="Right ear volume percentage. Type numerical value and press Enter."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
