import { useState } from 'react';
import { WavExporter, type ExportFormat } from '../audio/WavExporter.ts';
import { useAppStore } from '../store/useAppStore.ts';
import './ExportButton.css';

export function ExportButton() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
  const exportStatus = useAppStore((s) => s.exportStatus);
  const setExportStatus = useAppStore((s) => s.setExportStatus);

  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const ambientLayers = useAppStore((s) => s.ambientLayers);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);
  const timerDurationSeconds = useAppStore((s) => s.timerDurationSeconds);

  // Use session duration (defaults to 5 minutes if timer is Off)
  const exportDuration = timerDurationSeconds > 0 ? timerDurationSeconds : 300;

  const isExporting = exportStatus === 'rendering' || exportStatus === 'encoding';

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setExportStatus('rendering');

      const { blob, filename } = await WavExporter.exportAudio(
        {
          carrierFrequency,
          beatFrequency,
          masterVolume,
          leftVolume,
          rightVolume,
          ambientLayers,
          durationSeconds: exportDuration,
          fadeInSeconds,
          fadeOutSeconds,
        },
        exportFormat,
        (status) => setExportStatus(status),
      );

      WavExporter.triggerDownload(blob, filename);

      setTimeout(() => {
        setExportStatus('idle');
      }, 2500);
    } catch (err) {
      console.error('Audio export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3500);
    }
  };

  const getStatusText = () => {
    switch (exportStatus) {
      case 'rendering':
        return 'Rendering offline audio...';
      case 'encoding':
        return exportFormat === 'wav'
          ? 'Encoding 16-bit WAV file...'
          : 'Encoding MP3 audio stream...';
      case 'done':
        return '✓ Export complete! Downloading...';
      case 'error':
        return '⚠ Export failed. Please try again.';
      default:
        return null;
    }
  };

  const wavSize = WavExporter.getEstimatedFileSize(exportDuration, 'wav');
  const mp3_320Size = WavExporter.getEstimatedFileSize(exportDuration, 'mp3-320');
  const mp3_192Size = WavExporter.getEstimatedFileSize(exportDuration, 'mp3-192');

  const buttonLabel = exportFormat === 'wav' ? 'Export WAV' : 'Export MP3';

  return (
    <div className="export-panel">
      {/* Format setting dropdown with size estimation */}
      <div className="control-row">
        <label htmlFor="export-format-select">Export Format &amp; File Size</label>
        <select
          id="export-format-select"
          className="export-select"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          disabled={isExporting}
        >
          <option value="wav">WAV (Best) — {wavSize}</option>
          <option value="mp3-320">MP3 320 kbps (High) — {mp3_320Size}</option>
          <option value="mp3-192">MP3 192 kbps (Good) — {mp3_192Size}</option>
        </select>
      </div>

      {/* Separate Export Button */}
      <div className="export-action-row">
        <button
          type="button"
          className={`export-btn ${isExporting ? 'is-loading' : ''}`}
          onClick={handleExport}
          disabled={isExporting}
          aria-label={`${buttonLabel} file (${exportFormat})`}
        >
          <span className="export-icon" aria-hidden="true">
            {isExporting ? '⏳' : '💾'}
          </span>
          {isExporting ? 'Exporting...' : buttonLabel}
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
