import { useAppStore } from '../store/useAppStore.ts';
import './VolumePanel.css';

export function VolumePanel() {
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const setMasterVolume = useAppStore((s) => s.setMasterVolume);
  const setLeftVolume = useAppStore((s) => s.setLeftVolume);
  const setRightVolume = useAppStore((s) => s.setRightVolume);

  return (
    <div className="volume-panel">
      {/* Master */}
      <div className="control-row">
        <label htmlFor="vol-master">Master</label>
        <div className="slider-group">
          <input
            id="vol-master"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
          />
          <span className="value-badge">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>

      {/* Left ear */}
      <div className="control-row">
        <label htmlFor="vol-left">Left Ear</label>
        <div className="slider-group">
          <input
            id="vol-left"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={leftVolume}
            onChange={(e) => setLeftVolume(Number(e.target.value))}
          />
          <span className="value-badge">{Math.round(leftVolume * 100)}%</span>
        </div>
      </div>

      {/* Right ear */}
      <div className="control-row">
        <label htmlFor="vol-right">Right Ear</label>
        <div className="slider-group">
          <input
            id="vol-right"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={rightVolume}
            onChange={(e) => setRightVolume(Number(e.target.value))}
          />
          <span className="value-badge">{Math.round(rightVolume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
