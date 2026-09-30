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
  const binauralEnabled = useAppStore((s) => s.binauralEnabled);
  const setBinauralEnabled = useAppStore((s) => s.setBinauralEnabled);

  const binauralVolume = useAppStore((s) => s.binauralVolume);
  const setBinauralVolume = useAppStore((s) => s.setBinauralVolume);

  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);

  const setCarrierFrequency = useAppStore((s) => s.setCarrierFrequency);
  const setBeatFrequency = useAppStore((s) => s.setBeatFrequency);
  const setLeftVolume = useAppStore((s) => s.setLeftVolume);
  const setRightVolume = useAppStore((s) => s.setRightVolume);

  const currentBand = getBrainwaveBand(beatFrequency);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="frequency-panel">
      {/* Checkbox toggle header */}
      <div className="panel-toggle-row binaural-toggle-row">
        <label className="panel-checkbox-label binaural-checkbox-label" htmlFor="binaural-enabled-checkbox">
          <input
            id="binaural-enabled-checkbox"
            type="checkbox"
            className="panel-checkbox binaural-checkbox"
            checked={binauralEnabled}
            onChange={(e) => setBinauralEnabled(e.target.checked)}
          />
          <span className="panel-checkbox-title binaural-checkbox-title">Binaural Beats</span>
        </label>
      </div>

      {/* Options revealed only when ticked */}
      {binauralEnabled && (
        <div className="binaural-options-container">
          {/* Tone Volume (Default 50%) */}
          <div className="control-row">
            <label htmlFor="binaural-tone-vol">Tone Volume</label>
            <div className="slider-group">
              <input
                id="binaural-tone-vol"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={binauralVolume}
                onChange={(e) => setBinauralVolume(Number(e.target.value))}
              />
              <CommitInput
                value={binauralVolume}
                min={0}
                max={1}
                formatDisplay={(v) => `${Math.round(v * 100)}%`}
                parseInput={parsePercent}
                onCommit={(v) => setBinauralVolume(v)}
                ariaLabel="Binaural tone volume percentage. Type value and press Enter."
              />
            </div>
          </div>

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

          {/* Left and Right Ear Volume Balance */}
          <div className="ear-balance-row">
            <div className="control-row ear-half">
              <label htmlFor="vol-left">Left Ear</label>
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
                  formatDisplay={(v) => `${Math.round(v * 100)}%`}
                  parseInput={parsePercent}
                  onCommit={(v) => setLeftVolume(v)}
                  ariaLabel="Left ear volume percentage."
                />
              </div>
            </div>

            <div className="control-row ear-half">
              <label htmlFor="vol-right">Right Ear</label>
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
                  formatDisplay={(v) => `${Math.round(v * 100)}%`}
                  parseInput={parsePercent}
                  onCommit={(v) => setRightVolume(v)}
                  ariaLabel="Right ear volume percentage."
                />
              </div>
            </div>
          </div>

          {/* Frequency Readout */}
          <div className="freq-readout" aria-live="polite">
            <span className="ear-label">
              Left: {(carrierFrequency - beatFrequency / 2).toFixed(1)} Hz
            </span>
            <span className="ear-label">
              Right: {(carrierFrequency + beatFrequency / 2).toFixed(1)} Hz
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
