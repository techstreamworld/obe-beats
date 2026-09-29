import { useState, useEffect, useRef, useCallback } from 'react';
import './BlackScreen.css';

export function BlackScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  const requestFullscreenMode = async () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      }
    } catch {
      // Non-fatal if browser blocks or user disallows fullscreen
    }
  };

  const exitFullscreenMode = async () => {
    try {
      if (document.fullscreenElement) {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          mozCancelFullScreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch {
      // Ignore exit fullscreen errors
    }
  };

  const startBlackScreen = () => {
    setIsOpen(true);
    requestFullscreenMode();

    // Request animation frame so DOM element mounts before opacity transition begins
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsFadingIn(true);
      });
    });
  };

  const endBlackScreen = useCallback(() => {
    exitFullscreenMode();

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
  }, []);

  // Double tap handler for mobile devices
  const handleOverlayTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Ignore taps on the close button (handled by its own onClick)
    if ((e.target as HTMLElement).closest('.black-screen-close-btn')) {
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    if (timeSinceLastTap > 0 && timeSinceLastTap < 400) {
      // Double tap detected!
      endBlackScreen();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Double click handler for desktop
  const handleOverlayDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.black-screen-close-btn')) {
      return;
    }
    endBlackScreen();
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
  }, [isOpen, endBlackScreen]);

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
        onClick={isOpen ? endBlackScreen : startBlackScreen}
        aria-label={isOpen ? 'Exit black screen mode' : 'Switch to black screen mode and enter fullscreen'}
        title="Switch to black screen and toggle fullscreen"
      >
        <span className="moon-icon" aria-hidden="true">🌙</span>
        Black Screen
      </button>

      {isOpen && (
        <div
          className={`black-screen-overlay ${isFadingIn ? 'fade-to-black' : 'fade-to-bright'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Black screen mode active. Double tap or click X to exit."
          onTouchEnd={handleOverlayTouchEnd}
          onDoubleClick={handleOverlayDoubleClick}
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
