import { useAppStore } from '../store/useAppStore.ts';
import './FrequencyPanel.css';

export function FrequencyPanel() {
  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const setCarrierFrequency = useAppStore((s) => s.setCarrierFrequency);
  const setBeatFrequency = useAppStore((s) => s.setBeatFrequency);

  const leftFreq = carrierFrequency - beatFrequency / 2;
  const rightFreq = carrierFrequency + beatFrequency / 2;

  return (
    <div className="frequency-panel">
      {/* Beat frequency */}
      <div className="control-row">
        <label htmlFor="beat-freq">Beat Frequency</label>
        <div className="slider-group">
          <input
            id="beat-freq"
            type="range"
            min={0.5}
            max={40}
            step={0.5}
            value={beatFrequency}
            onChange={(e) => setBeatFrequency(Number(e.target.value))}
          />
          <span className="value-badge">{beatFrequency.toFixed(1)} Hz</span>
        </div>
      </div>

      {/* Carrier frequency */}
      <div className="control-row">
        <label htmlFor="carrier-freq">Carrier Frequency</label>
        <div className="slider-group">
          <input
            id="carrier-freq"
            type="range"
            min={20}
            max={1500}
            step={1}
            value={carrierFrequency}
            onChange={(e) => setCarrierFrequency(Number(e.target.value))}
          />
          <span className="value-badge">{carrierFrequency} Hz</span>
        </div>
      </div>

      {/* L/R readout */}
      <div className="freq-readout">
        <span className="ear-label">L {leftFreq.toFixed(1)} Hz</span>
        <span className="ear-label">R {rightFreq.toFixed(1)} Hz</span>
      </div>
    </div>
  );
}
