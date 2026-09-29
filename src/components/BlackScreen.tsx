import { useState, useEffect, useRef } from 'react';
import './BlackScreen.css';

export function BlackScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const startBlackScreen = () => {
    setIsOpen(true);
    // Request animation frame so DOM element mounts before opacity transition begins
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsFadingIn(true);
      });
    });
  };

  const endBlackScreen = () => {
    // Initiate 5s fade back to brightness
    setIsFadingIn(false);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // Wait for the 5-second fade-out transition to complete before unmounting
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      timeoutRef.current = null;
    }, 5000);
  };

  // Allow closing via Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endBlackScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="black-screen-trigger-btn"
        onClick={startBlackScreen}
        aria-label="Switch to black screen mode"
      >
        <span className="moon-icon" aria-hidden="true">🌙</span>
        Black Screen
      </button>

      {isOpen && (
        <div
          className={`black-screen-overlay ${isFadingIn ? 'fade-to-black' : 'fade-to-bright'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Black screen mode active"
        >
          {/* Grey X close button on the top right */}
          <button
            type="button"
            className="black-screen-close-btn"
            onClick={endBlackScreen}
            aria-label="Close black screen and restore brightness"
            title="Exit black screen"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
