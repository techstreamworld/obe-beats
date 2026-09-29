import { useAppStore } from '../store/useAppStore.ts';
import type { AmbientSoundEntry } from '../types/index.ts';
import './AmbientPanel.css';

/** Catalogue matching the user's dropdown design. */
const AMBIENT_CATALOGUE: AmbientSoundEntry[] = [
  // Nature Sounds (file-based — placeholder until audio files are provided)
  { id: 'rain',         label: 'Rain',         group: 'nature' },
  { id: 'forest-rain',  label: 'Forest Rain',  group: 'nature' },
  { id: 'ocean-waves',  label: 'Ocean Waves',  group: 'nature' },
  // Noise Colors (generated in code)
  { id: 'white-noise',  label: 'White Noise',  group: 'noise' },
  { id: 'pink-noise',   label: 'Pink Noise',   group: 'noise' },
  { id: 'brown-noise',  label: 'Brown Noise',  group: 'noise' },
];

const natureSounds = AMBIENT_CATALOGUE.filter((s) => s.group === 'nature');
const noiseColors  = AMBIENT_CATALOGUE.filter((s) => s.group === 'noise');

export function AmbientPanel() {
  const selectedId = useAppStore((s) => s.selectedAmbientId);
  const ambientVolume = useAppStore((s) => s.ambientVolume);
  const setSelected = useAppStore((s) => s.setSelectedAmbient);
  const setVolume = useAppStore((s) => s.setAmbientVolume);

  return (
    <div className="ambient-panel">
      {/* Dropdown */}
      <div className="control-row">
        <label htmlFor="ambient-select">Ambient Sound</label>
        <select
          id="ambient-select"
          className="ambient-select"
          value={selectedId ?? ''}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          <optgroup label="No Ambient">
            <option value="">No Ambient</option>
          </optgroup>
          <optgroup label="Nature Sounds">
            {natureSounds.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </optgroup>
          <optgroup label="Noise Colors">
            {noiseColors.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Volume (only shown when an ambient is selected) */}
      {selectedId && (
        <div className="control-row">
          <label htmlFor="ambient-volume">Ambient Volume</label>
          <div className="slider-group">
            <input
              id="ambient-volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={ambientVolume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
            <span className="value-badge">
              {Math.round(ambientVolume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
