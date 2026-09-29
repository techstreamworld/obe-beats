// ─── useTimer ───
// Bridges Zustand timer state to TimerController + AudioEngine fades.
// Starts/stops the countdown in sync with playback.

import { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { TimerController } from '../audio/TimerController.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useTimer(): void {
  const timerRef = useRef<TimerController | null>(null);
  const fadeOutTriggered = useRef(false);

  const playback = useAppStore((s) => s.playback);
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);
  const updateTimerState = useAppStore((s) => s.updateTimerState);
  const stopPlayback = useAppStore((s) => s.stop);

  useEffect(() => {
    // Only act when playback starts and a timer duration is set
    if (playback !== 'playing' || timerDuration <= 0) {
      // Playback stopped (or no timer) — tear down any running timer
      timerRef.current?.stop();
      timerRef.current = null;
      fadeOutTriggered.current = false;
      updateTimerState({ remainingSeconds: 0, isRunning: false });
      return;
    }

    const engine = AudioEngine.getInstance();

    // Fade in at the start of the session
    if (fadeInSeconds > 0) {
      engine.fadeIn(fadeInSeconds);
    }

    fadeOutTriggered.current = false;

    const controller = new TimerController(
      // onTick
      (remaining) => {
        updateTimerState({ remainingSeconds: remaining, isRunning: true });

        // Trigger fade-out when we're fadeOutSeconds away from the end
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

    controller.start(timerDuration);
    timerRef.current = controller;

    return () => {
      controller.stop();
    };
  }, [playback, timerDuration, fadeInSeconds, fadeOutSeconds, updateTimerState, stopPlayback]);
}
