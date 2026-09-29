// ─── useTimer ───
// Bridges Zustand timer state to TimerController + AudioEngine fades.
// Starts/stops the countdown in sync with playback without interrupting live audio when duration changes.

import { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { TimerController } from '../audio/TimerController.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useTimer(): void {
  const timerRef = useRef<TimerController | null>(null);
  const fadeOutTriggered = useRef(false);
  const timerDurationRef = useRef(useAppStore.getState().timerDurationSeconds);
  const prevDurationRef = useRef(useAppStore.getState().timerDurationSeconds);

  const playback = useAppStore((s) => s.playback);
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);
  const updateTimerState = useAppStore((s) => s.updateTimerState);
  const stopPlayback = useAppStore((s) => s.stop);

  // Keep duration ref in sync
  useEffect(() => {
    timerDurationRef.current = timerDuration;
  }, [timerDuration]);

  // 1. Playback lifecycle effect: only runs when playback starts or stops
  useEffect(() => {
    if (playback === 'playing') {
      const engine = AudioEngine.getInstance();

      if (fadeInSeconds > 0) {
        engine.fadeIn(fadeInSeconds);
      }

      fadeOutTriggered.current = false;

      const controller = new TimerController(
        // onTick
        (remaining) => {
          updateTimerState({ remainingSeconds: remaining, isRunning: true });

          // Trigger fade-out when near the end
          if (
            !fadeOutTriggered.current &&
            fadeOutSeconds > 0 &&
            remaining <= fadeOutSeconds
          ) {
            fadeOutTriggered.current = true;
            engine.fadeOut(fadeOutSeconds);
          }
        },
        // onExpiry
        () => {
          updateTimerState({ remainingSeconds: 0, isRunning: false });
          stopPlayback();
        },
      );

      timerRef.current = controller;
      const initialDuration = timerDurationRef.current;
      prevDurationRef.current = initialDuration;

      if (initialDuration > 0) {
        controller.start(initialDuration);
      } else {
        updateTimerState({ remainingSeconds: 0, isRunning: false });
      }
    } else {
      // Stopped: clean up timer
      timerRef.current?.stop();
      timerRef.current = null;
      fadeOutTriggered.current = false;
      updateTimerState({ remainingSeconds: 0, isRunning: false });
    }

    return () => {
      timerRef.current?.stop();
    };
  }, [playback, fadeInSeconds, fadeOutSeconds, updateTimerState, stopPlayback]);

  // 2. Duration change effect: smoothly adjusts the running countdown without interrupting playback
  useEffect(() => {
    if (playback === 'playing' && timerRef.current) {
      timerRef.current.adjustDuration(timerDuration, prevDurationRef.current);
    }
    prevDurationRef.current = timerDuration;
  }, [timerDuration, playback]);
}
