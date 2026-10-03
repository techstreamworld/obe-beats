import { useState } from 'react';
import './VolumeMuteButton.css';

interface VolumeMuteButtonProps {
  volume: number;
  onChange: (newVolume: number) => void;
  label?: string;
}

export function VolumeMuteButton({
  volume,
  onChange,
  label = 'Volume',
}: VolumeMuteButtonProps) {
  const isMuted = volume <= 0.001;
  const [savedVolume, setSavedVolume] = useState<number>(volume > 0.001 ? volume : 0.5);

  const handleToggle = () => {
    if (isMuted) {
      onChange(savedVolume > 0.001 ? savedVolume : 0.5);
    } else {
      setSavedVolume(volume);
      onChange(0);
    }
  };

  const titleText = isMuted ? `Unmute ${label}` : `Mute ${label}`;

  return (
    <button
      type="button"
      className={`volume-mute-btn ${isMuted ? 'is-muted' : ''}`}
      onClick={handleToggle}
      title={titleText}
      aria-label={titleText}
    >
      {isMuted ? (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
