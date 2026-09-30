import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import './FrequencyPanel.css';

interface BrainwaveBand {
  name: string;
  range: string;
}

/**
 * Returns the brainwave band corresponding to the given beat frequency:
 * 1 <= Hz <= 4       Delta
 * 4 < Hz <= 8        Theta
 * 8 < Hz <= 13       Alpha
 * 13 < Hz <= 30      Beta
 * 30 < Hz <= 40      Gamma
 */
function getBrainwaveBand(hz: number): BrainwaveBand {
  if (hz > 30) {
    return { name: 'Gamma', range: '30 < Hz <= 40' };
  }
  if (hz > 13) {
    return { name: 'Beta', range: '13 < Hz <= 30' };
  }
  if (hz > 8) {
    return { name: 'Alpha', range: '8 < Hz <= 13' };
  }
  if (hz > 4) {
    return { name: 'Theta', range: '4 < Hz <= 8' };
  }
  return { name: 'Delta', range: '1 <= Hz <= 4' };
}

export function FrequencyPanel() {
  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const setCarrierFrequency = useAppStore((s) => s.setCarrierFrequency);
  const setBeatFrequency = useAppStore((s) => s.setBeatFrequency);

  const currentBand = getBrainwaveBand(beatFrequency);

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
            step={0.1}
            value={beatFrequency}
            onChange={(e) => setBeatFrequency(Number(e.target.value))}
          />
          <CommitInput
            value={beatFrequency}
            min={0.5}
            max={40.0}
            formatDisplay={(v) => `${Number.isInteger(v * 10) ? v.toFixed(1) : v.toFixed(2)} Hz`}
            parseInput={(str) => {
              const num = parseFloat(str.replace(/[^0-9.]/g, ''));
              return isNaN(num) ? null : Math.round(num * 100) / 100;
            }}
            onCommit={(v) => setBeatFrequency(v)}
            ariaLabel="Beat frequency in Hertz. Type exact value and press Enter."
          />
          <span
            className="wave-badge"
            title={`${currentBand.name} waves (${currentBand.range})`}
            aria-label={`Current brainwave band: ${currentBand.name} waves, range ${currentBand.range}`}
          >
            {currentBand.name} Waves
          </span>
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
          <CommitInput
            value={carrierFrequency}
            min={20}
            max={1500}
            formatDisplay={(v) => `${Math.round(v)} Hz`}
            parseInput={(str) => {
              const num = parseFloat(str.replace(/[^0-9.]/g, ''));
              return isNaN(num) ? null : Math.round(num);
            }}
            onCommit={(v) => setCarrierFrequency(v)}
            ariaLabel="Carrier frequency in Hertz. Type exact value and press Enter."
          />
        </div>
      </div>
    </div>
  );
}
