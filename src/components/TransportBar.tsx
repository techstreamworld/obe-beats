import { useAppStore } from '../store/useAppStore.ts';
import './TransportBar.css';

export function TransportBar() {
  const playback = useAppStore((s) => s.playback);
  const play = useAppStore((s) => s.play);
  const stop = useAppStore((s) => s.stop);

  const isPlaying = playback === 'playing';

  return (
    <div className="transport-bar">
      <button
        type="button"
        className={`transport-btn ${isPlaying ? 'is-playing' : ''}`}
        onClick={isPlaying ? stop : play}
        aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
      >
        <span className="transport-icon" aria-hidden="true">
          {isPlaying ? '■' : '▶'}
        </span>
        {isPlaying ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
