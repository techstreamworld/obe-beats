import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import { VolumeMuteButton } from './VolumeMuteButton.tsx';
import './VolumePanel.css';

export function VolumePanel() {
  const masterVolume = useAppStore((s) => s.masterVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);
  const earBalance = useAppStore((s) => s.earBalance);
  const setEarBalance = useAppStore((s) => s.setEarBalance);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="volume-panel">
      {/* Master Volume */}
      <div className="control-row">
        <label htmlFor="vol-master">Main Volume (%)</label>
        <div className="slider-group">
          <VolumeMuteButton
            volume={masterVolume}
            onChange={(v) => setMasterVolume(v)}
            label="Main volume"
          />
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

      {/* Ear Balance Slider */}
      <div className="control-row ear-balance-row">
        <label htmlFor="vol-ear-balance">Balance (%)</label>
        <div className="slider-group">
          <input
            id="vol-ear-balance"
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
