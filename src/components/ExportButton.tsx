import { useState, useEffect } from 'react';
import { WavExporter, type ExportFormat } from '../audio/WavExporter.ts';
import { useAppStore } from '../store/useAppStore.ts';
import './ExportButton.css';

export function ExportButton() {
  const exportFormat = useAppStore((s) => s.exportFormat);
  const setExportFormat = useAppStore((s) => s.setExportFormat);
  const exportStatus = useAppStore((s) => s.exportStatus);
  const setExportStatus = useAppStore((s) => s.setExportStatus);

  const binauralEnabled = useAppStore((s) => s.binauralEnabled);
  const binauralVolume = useAppStore((s) => s.binauralVolume);
  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const ambientEnabled = useAppStore((s) => s.ambientEnabled);
  const ambientLayers = useAppStore((s) => s.ambientLayers);
  const intervalEnabled = useAppStore((s) => s.intervalEnabled);
  const intervalTone = useAppStore((s) => s.intervalTone);
  const intervalMinutes = useAppStore((s) => s.intervalMinutes);
  const intervalVolume = useAppStore((s) => s.intervalVolume);
  const intervalRepeatCount = useAppStore((s) => s.intervalRepeatCount);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);
  const timerDurationSeconds = useAppStore((s) => s.timerDurationSeconds);

  // Popup warning modal state for WAV > 60 minutes
  const [showWavWarningModal, setShowWavWarningModal] = useState(false);

  // Use session duration (defaults to 5 minutes if timer is Off)
  const exportDuration = timerDurationSeconds > 0 ? timerDurationSeconds : 300;
  const isExporting = exportStatus === 'rendering' || exportStatus === 'encoding';

  // Handle Escape key to dismiss warning modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showWavWarningModal) {
        setShowWavWarningModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWavWarningModal]);

  const executeExport = async (format: ExportFormat) => {
    if (isExporting) return;

    try {
      setExportStatus('rendering');

      const { blob, filename } = await WavExporter.exportAudio(
        {
          binauralEnabled,
          binauralVolume,
          carrierFrequency,
          beatFrequency,
          masterVolume,
          leftVolume,
          rightVolume,
          ambientEnabled,
          ambientLayers,
          intervalTone,
          intervalMinutes: intervalEnabled ? intervalMinutes : 0,
          intervalVolume,
          intervalRepeatCount,
          durationSeconds: exportDuration,
          fadeInSeconds,
          fadeOutSeconds,
        },
        format,
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

  const handleExportClick = () => {
    if (isExporting) return;

    // Intercept WAV exports longer than 60 minutes (3600 seconds)
    if (exportFormat === 'wav' && exportDuration > 3600) {
      setShowWavWarningModal(true);
      return;
    }

    executeExport(exportFormat);
  };

  const handleSwitchToMp3AndExport = (format: 'mp3-320' | 'mp3-192') => {
    setShowWavWarningModal(false);
    setExportFormat(format);
    executeExport(format);
  };

  const handleProceedWithWav = () => {
    setShowWavWarningModal(false);
    executeExport('wav');
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
  const durationMins = Math.round(exportDuration / 60);

  const buttonLabel = exportFormat === 'wav' ? 'Export WAV' : 'Export MP3';

  return (
    <div className="export-panel">
      {/* Format setting dropdown with size estimation */}
      <div className="control-row">
        <label htmlFor="export-format-select">Format</label>
        <select
          id="export-format-select"
          className="export-select"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          disabled={isExporting}
        >
          <option value="wav">WAV 44.1 kHz, 16-bit (Best) — {wavSize}</option>
          <option value="mp3-320">MP3 320 kbps (High) — {mp3_320Size}</option>
          <option value="mp3-192">MP3 192 kbps (Good) — {mp3_192Size}</option>
        </select>
      </div>

      {/* Separate Export Button */}
      <div className="export-action-row">
        <button
          type="button"
          className={`export-btn ${isExporting ? 'is-loading' : ''}`}
          onClick={handleExportClick}
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

      {/* Warning popup modal for WAV sessions > 60 minutes */}
      {showWavWarningModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowWavWarningModal(false)}
          role="presentation"
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="wav-warning-title"
            aria-describedby="wav-warning-desc"
          >
            <div className="modal-header">
              <span className="modal-warning-icon">⚠️</span>
              <h2 id="wav-warning-title" className="modal-title">
                Large WAV File Warning
              </h2>
            </div>

            <div id="wav-warning-desc" className="modal-body">
              <p>
                Your session duration is <strong>{durationMins} minutes</strong>. An uncompressed
                16-bit 44.1 kHz WAV file of this length will be approximately <strong>{wavSize}</strong>.
              </p>
              <p>
                Generating and downloading a file this large inside the browser may consume significant memory
                and can cause browser performance issues or download failures.
              </p>
              <p className="modal-recommendation">
                We strongly recommend exporting as <strong>MP3 320 kbps ({mp3_320Size})</strong> for full audio fidelity
                with reliable performance.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-primary"
                onClick={() => handleSwitchToMp3AndExport('mp3-320')}
              >
                Switch to MP3 320 kbps &amp; Download (Recommended)
              </button>

              <button
                type="button"
                className="modal-btn modal-btn-secondary"
                onClick={handleProceedWithWav}
              >
                Proceed with WAV Anyway ({wavSize})
              </button>

              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowWavWarningModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
