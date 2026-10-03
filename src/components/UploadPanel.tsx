import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.ts';
import { CommitInput } from './CommitInput.tsx';
import { AudioEngine } from '../audio/AudioEngine.ts';
import './UploadPanel.css';

export function UploadPanel() {
  const uploadEnabled = useAppStore((s) => s.uploadEnabled);
  const setUploadEnabled = useAppStore((s) => s.setUploadEnabled);
  const uploadVolume = useAppStore((s) => s.uploadVolume);
  const setUploadVolume = useAppStore((s) => s.setUploadVolume);
  const playback = useAppStore((s) => s.playback);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBuffer, setUploadBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const parsePercent = (str: string) => {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return null;
    return Math.min(1, Math.max(0, Math.round(num) / 100));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsDecoding(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = AudioEngine.getInstance().getContext();
      if (!ctx) {
        // If context isn't ready yet, force a brief initialization
        const engine = AudioEngine.getInstance();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (engine as any).ensureContext();
      }
      
      const decodeCtx = AudioEngine.getInstance().getContext() || new AudioContext();
      
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      setUploadBuffer(audioBuffer);
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      setErrorMsg('Failed to read or decode audio file.');
      setUploadFile(null);
      setUploadBuffer(null);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleClear = () => {
    setUploadFile(null);
    setUploadBuffer(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopPlayback();
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // ignore
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  const startPlayback = () => {
    stopPlayback();
    if (!uploadEnabled || !uploadBuffer || playback !== 'playing') return;

    const ctx = AudioEngine.getInstance().getContext();
    const masterGain = AudioEngine.getInstance().getMasterGain();
    if (!ctx || !masterGain) return;

    const source = ctx.createBufferSource();
    source.buffer = uploadBuffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = uploadVolume;

    source.connect(gain);
    gain.connect(masterGain);

    source.start();
    sourceNodeRef.current = source;
    gainNodeRef.current = gain;
  };

  useEffect(() => {
    if (playback === 'playing') {
      startPlayback();
    } else {
      stopPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback, uploadEnabled, uploadBuffer]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = uploadVolume;
    }
  }, [uploadVolume]);

  return (
    <div className="upload-panel">
      <div className="panel-toggle-row">
        <label className="panel-checkbox-label" htmlFor="upload-enabled-checkbox">
          <input
            id="upload-enabled-checkbox"
            type="checkbox"
            className="panel-checkbox"
            checked={uploadEnabled}
            onChange={(e) => setUploadEnabled(e.target.checked)}
          />
          <span className="panel-checkbox-title">Upload Audio</span>
        </label>
      </div>

      {uploadEnabled && (
        <div className="upload-options-container">
          {!uploadFile && (
            <label className="upload-drop-zone">
              <input
                ref={fileInputRef}
                type="file"
                className="upload-hidden-input"
                accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,.opus"
                onChange={handleFileChange}
              />
              <div className="upload-prompt">
                {isDecoding ? 'Decoding...' : 'Click or drop audio file here'}
              </div>
            </label>
          )}

          {errorMsg && <div className="upload-error">{errorMsg}</div>}

          {uploadFile && (
            <div className="upload-file-info">
              <div className="upload-filename">
                <span>{uploadFile.name}</span>
                <button type="button" className="upload-clear-btn" onClick={handleClear}>
                  ✕
                </button>
              </div>

              {isDecoding && <div className="upload-decoding">Decoding audio...</div>}

              {uploadBuffer && (
                <div className="control-row upload-volume-row">
                  <label htmlFor="upload-volume">Volume (%)</label>
                  <div className="slider-group">
                    <input
                      id="upload-volume"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={uploadVolume}
                      onChange={(e) => setUploadVolume(Number(e.target.value))}
                    />
                    <CommitInput
                      value={uploadVolume}
                      min={0}
                      max={1}
                      formatDisplay={(v) => `${Math.round(v * 100)}`}
                      parseInput={parsePercent}
                      onCommit={(v) => setUploadVolume(v)}
                      ariaLabel="Upload volume percentage. Type numerical value and press Enter."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
