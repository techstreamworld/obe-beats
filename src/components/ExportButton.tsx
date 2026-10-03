import { useState, useEffect, useRef } from 'react';
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
  
  // Export cancellation and estimation state
  const abortControllerRef = useRef<AbortController | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null);
  const exportStartTimeRef = useRef(0);
  const latestProgressRef = useRef(0);

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

  // Periodic interval to dynamically recheck status and recalculate accurate remaining time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isExporting) {
      interval = setInterval(() => {
        const elapsedSec = (Date.now() - exportStartTimeRef.current) / 1000;
        const currentProgress = latestProgressRef.current;

        if (currentProgress > 0.05 && currentProgress < 0.99) {
          // Accurate recalculation based on actual processed progress rate
          const progressRate = currentProgress / Math.max(0.5, elapsedSec);
          const remSec = Math.max(1, Math.round((1 - currentProgress) / progressRate));
          setEstimatedRemainingSec(remSec);
        } else {
          // Smooth countdown before reliable progress rate is established
          setEstimatedRemainingSec((prev) => (prev !== null && prev > 1 ? prev - 1 : 1));
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExporting]);

  const cancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setExportStatus('idle');
      setExportProgress(0);
      setEstimatedRemainingSec(null);
    }
  };

  const executeExport = async (format: ExportFormat) => {
    if (isExporting) return;

    // Initial estimation baseline
    const initialEst = format === 'wav'
      ? Math.ceil(exportDuration / 35)
      : Math.ceil(exportDuration / 4);

    setEstimatedRemainingSec(Math.max(2, initialEst));
    setExportProgress(0);
    latestProgressRef.current = 0.05;
    exportStartTimeRef.current = Date.now();
    abortControllerRef.current = new AbortController();

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
          signal: abortControllerRef.current.signal,
        },
        format,
        (status, progress) => {
          setExportStatus(status);
          if (progress !== undefined) {
            latestProgressRef.current = progress;
            setExportProgress(progress);
          }
        },
      );

      WavExporter.triggerDownload(blob, filename);

      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setEstimatedRemainingSec(null);
      }, 2500);
    } catch (err) {
      console.error('Audio export error:', err);
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
        setEstimatedRemainingSec(null);
      }, 3500);
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
    if (exportStatus === 'done') return '✓ Export complete! Downloading...';
    if (exportStatus === 'error') return '⚠ Export cancelled or failed.';
    
    const remSuffix = estimatedRemainingSec !== null
      ? ` (~${estimatedRemainingSec}s remaining)`
      : '';

    if (exportStatus === 'rendering') {
      return `Rendering offline audio...${remSuffix}`;
    }

    if (exportStatus === 'encoding') {
      const pctText = exportProgress > 0 ? ` ${Math.round(exportProgress * 100)}%` : '';
      const baseText = exportFormat === 'wav'
        ? 'Encoding 16-bit WAV file...'
        : 'Encoding MP3 audio stream...';
      return `${baseText}${pctText}${remSuffix}`;
    }

    return null;
  };

  const wavSize = WavExporter.getEstimatedFileSize(exportDuration, 'wav');
  const mp3_320Size = WavExporter.getEstimatedFileSize(exportDuration, 'mp3-320');
  const mp3_192Size = WavExporter.getEstimatedFileSize(exportDuration, 'mp3-192');
  const durationMins = Math.round(exportDuration / 60);

  return (
    <div className="export-panel">
      {/* Format setting dropdown & Export button on the same line */}
      <div className="control-row export-row">
        <label htmlFor="export-format-select">Format</label>
        <div className="export-controls-group">
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

          {!isExporting ? (
            <button
              type="button"
              className="export-btn"
              onClick={handleExportClick}
              aria-label={`Export file (${exportFormat})`}
              title={`Export audio as ${exportFormat.toUpperCase()}`}
            >
              <span className="export-icon" aria-hidden="true">💾</span>
              <span className="export-btn-label">Export</span>
            </button>
          ) : (
            <button
              type="button"
              className="export-btn export-btn-cancel"
              onClick={cancelExport}
              aria-label="Cancel export"
            >
              <span className="export-icon" aria-hidden="true">✕</span>
              <span className="export-btn-label">Cancel</span>
            </button>
          )}
        </div>
      </div>

      {getStatusText() && (
        <p className={`export-status-message status-${exportStatus}`} aria-live="polite">
          {getStatusText()}
        </p>
      )}

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
                At <strong>{durationMins} min</strong>, this WAV file will be approximately <strong>{wavSize}</strong>, which may cause browser memory or download issues.
              </p>
              <p className="modal-recommendation">
                We recommend <strong>MP3 320 kbps ({mp3_320Size})</strong> for full audio fidelity with reliable performance.
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
