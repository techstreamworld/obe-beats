import { useState } from 'react';
import { WavExporter } from '../audio/WavExporter.ts';
import { useAppStore } from '../store/useAppStore.ts';
import './ExportButton.css';

const DURATION_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '60 min', seconds: 3600 },
];

export function ExportButton() {
  const [selectedDuration, setSelectedDuration] = useState(300); // 5 minutes default
  const exportStatus = useAppStore((s) => s.exportStatus);
  const setExportStatus = useAppStore((s) => s.setExportStatus);

  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const selectedAmbientId = useAppStore((s) => s.selectedAmbientId);
  const ambientVolume = useAppStore((s) => s.ambientVolume);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);

  const isExporting = exportStatus === 'rendering' || exportStatus === 'encoding';

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setExportStatus('rendering');

      const blob = await WavExporter.exportToWav(
        {
          carrierFrequency,
          beatFrequency,
          masterVolume,
          leftVolume,
          rightVolume,
          ambientId: selectedAmbientId,
          ambientVolume,
          durationSeconds: selectedDuration,
          fadeInSeconds,
          fadeOutSeconds,
        },
        (status) => setExportStatus(status),
      );

      const filename = `obe-beats_${carrierFrequency}hz_${beatFrequency}hz_${selectedDuration / 60}m.wav`;
      WavExporter.triggerDownload(blob, filename);

      setTimeout(() => {
        setExportStatus('idle');
      }, 2500);
    } catch (err) {
      console.error('WAV export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3500);
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case 'rendering':
        return 'Rendering offline audio...';
      case 'encoding':
        return 'Encoding 16-bit WAV file...';
      case 'done':
        return '✓ Export ready! Downloading...';
      case 'error':
        return '⚠ Export failed. Please try again.';
      default:
        return null;
    }
  };

  return (
    <div className="export-panel">
      <div className="control-row">
        <label htmlFor="export-duration">Export Duration</label>
        <div className="preset-group">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.seconds}
              type="button"
              className={`preset-btn ${selectedDuration === preset.seconds ? 'is-active' : ''}`}
              onClick={() => setSelectedDuration(preset.seconds)}
              disabled={isExporting}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="export-action-row">
        <button
          type="button"
          className={`export-btn ${isExporting ? 'is-loading' : ''}`}
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Export session as WAV file"
        >
          <span className="export-icon" aria-hidden="true">
            {isExporting ? '⏳' : '💾'}
          </span>
          {isExporting ? 'Exporting...' : 'Export WAV'}
        </button>

        {getStatusText() && (
          <p className={`export-status-message status-${exportStatus}`} aria-live="polite">
            {getStatusText()}
          </p>
        )}
      </div>
    </div>
  );
}
