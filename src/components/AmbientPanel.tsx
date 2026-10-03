import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import { VolumeMuteButton } from './VolumeMuteButton.tsx';
import type { AmbientSoundEntry } from '../types/index.ts';
import './AmbientPanel.css';

/** Catalogue matching the user's dropdown design. */
const AMBIENT_CATALOGUE: AmbientSoundEntry[] = [
  // Nature Sounds (audio files in /sound/)
  { id: 'rain',        label: 'Rain',        group: 'nature' },
  { id: 'ocean-waves', label: 'Ocean Waves', group: 'nature' },
  { id: 'river',       label: 'River',       group: 'nature' },
  { id: 'fireplace',   label: 'Fireplace',   group: 'nature' },
  { id: 'deep-sea',    label: 'Deep Sea',    group: 'nature' },
  // Noise (generated in code)
  { id: 'white-noise', label: 'White',       group: 'noise' },
  { id: 'pink-noise',  label: 'Pink',        group: 'noise' },
  { id: 'brown-noise', label: 'Brown',       group: 'noise' },
  { id: 'black-noise', label: 'Black',       group: 'noise' },
];

const natureSounds = AMBIENT_CATALOGUE.filter((s) => s.group === 'nature');
const noiseSounds  = AMBIENT_CATALOGUE.filter((s) => s.group === 'noise');

export function AmbientPanel() {
  const ambientEnabled = useAppStore((s) => s.ambientEnabled);
  const setAmbientEnabled = useAppStore((s) => s.setAmbientEnabled);

  const ambientLayers = useAppStore((s) => s.ambientLayers);
  const setAmbientLayerSound = useAppStore((s) => s.setAmbientLayerSound);
  const setAmbientLayerVolume = useAppStore((s) => s.setAmbientLayerVolume);
  const addAmbientLayer = useAppStore((s) => s.addAmbientLayer);
  const removeAmbientLayer = useAppStore((s) => s.removeAmbientLayer);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  return (
    <div className="ambient-panel">
      {/* Checkbox toggle header */}
      <div className="panel-toggle-row ambient-toggle-row">
        <label className="panel-checkbox-label ambient-checkbox-label" htmlFor="ambient-enabled-checkbox">
          <input
            id="ambient-enabled-checkbox"
            type="checkbox"
            className="panel-checkbox ambient-checkbox"
            checked={ambientEnabled}
            onChange={(e) => setAmbientEnabled(e.target.checked)}
          />
          <span className="panel-checkbox-title ambient-checkbox-title">Ambient Sound</span>
        </label>
      </div>

      {/* Options revealed only when ticked */}
      {ambientEnabled && (
        <div className="ambient-options-container">
          {ambientLayers.map((layer, index) => {
            const isSelected = Boolean(layer.soundId);
            const layerTitle = ambientLayers.length > 1 ? `Sound ${index + 1}` : 'Sound';

            return (
              <div key={layer.id} className="ambient-layer-row">
                {/* Dropdown Row */}
                <div className="control-row">
                  <div className="ambient-layer-header">
                    <label htmlFor={`ambient-select-${layer.id}`}>{layerTitle}</label>
                    {ambientLayers.length > 1 && (
                      <button
                        type="button"
                        className="remove-layer-btn"
                        onClick={() => removeAmbientLayer(layer.id)}
                        title="Remove ambient layer"
                        aria-label={`Remove ${layerTitle}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    id={`ambient-select-${layer.id}`}
                    className="ambient-select"
                    value={layer.soundId ?? ''}
                    onChange={(e) => setAmbientLayerSound(layer.id, e.target.value || null)}
                  >
                    <option value="">None</option>
                    <optgroup label="Nature Sounds">
                      {natureSounds.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Noise">
                      {noiseSounds.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Volume (only shown when an ambient sound is selected for this layer) */}
                {isSelected && (
                  <div className="control-row ambient-volume-row">
                    <div className="control-label-group">
                      <label htmlFor={`ambient-volume-${layer.id}`}>Volume (%)</label>
                      <VolumeMuteButton
                        volume={layer.volume}
                        onChange={(v) => setAmbientLayerVolume(layer.id, v)}
                        label={ambientLayers.length > 1 ? `Sound ${index + 1} volume` : 'Ambient volume'}
                      />
                    </div>
                    <div className="slider-group">
                      <input
                        id={`ambient-volume-${layer.id}`}
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={layer.volume}
                        onChange={(e) => setAmbientLayerVolume(layer.id, Number(e.target.value))}
                      />
                      <CommitInput
                        value={layer.volume}
                        min={0}
                        max={1}
                        formatDisplay={(v) => `${Math.round(v * 100)}`}
                        parseInput={parsePercent}
                        onCommit={(v) => setAmbientLayerVolume(layer.id, v)}
                        ariaLabel={`${layerTitle} volume percentage. Type numerical value and press Enter.`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {Boolean(ambientLayers[0]?.soundId) && ambientLayers.length < 8 && (
            <button
              type="button"
              className="add-layer-btn"
              onClick={addAmbientLayer}
            >
              + Add Ambient Sound
            </button>
          )}
        </div>
      )}
    </div>
  );
}
