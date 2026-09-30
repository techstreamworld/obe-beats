import { PRESETS } from '../constants/presets.ts';
import { useAppStore } from '../store/useAppStore.ts';
import './PresetBar.css';

export function PresetBar() {
  const activePresetId = useAppStore((s) => s.activePresetId);
  const applyPreset = useAppStore((s) => s.applyPreset);

  return (
    <section className="preset-bar" aria-label="Audio Presets">
      <div className="preset-bar-header">
        <span className="preset-bar-title">Presets</span>
      </div>

      <div className="preset-vertical-list">
        {PRESETS.map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`preset-card ${isActive ? 'is-active' : ''}`}
              onClick={() => applyPreset(p.id)}
              aria-pressed={isActive}
            >
              <div className="preset-card-top">
                <span className="preset-name">{p.name}</span>
                {isActive && <span className="preset-active-pill">Active</span>}
              </div>

              <div className="preset-tagline">{p.tagline}</div>

              <div className="preset-badge-row">
                <span className="preset-badge">{p.badge}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
