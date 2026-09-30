// ─── useTimer ───
// Bridges Zustand timer state to TimerController + AudioEngine fades.
// Coordinates countdowns, fades, play/pause, restart, and reset.

import { useEffect, useRef } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { TimerController } from '../audio/TimerController.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useTimer(): void {
  const timerRef = useRef<TimerController | null>(null);
  const fadeOutTriggered = useRef(false);
  const timerDurationRef = useRef(useAppStore.getState().timerDurationSeconds);
  const prevDurationRef = useRef(useAppStore.getState().timerDurationSeconds);
  const prevPlaybackRef = useRef(useAppStore.getState().playback);
  const prevRestartKeyRef = useRef(useAppStore.getState().restartKey);

  const playback = useAppStore((s) => s.playback);
  const restartKey = useAppStore((s) => s.restartKey);
  const timerDuration = useAppStore((s) => s.timerDurationSeconds);
  const fadeInSeconds = useAppStore((s) => s.fadeInSeconds);
  const fadeOutSeconds = useAppStore((s) => s.fadeOutSeconds);
  const updateTimerState = useAppStore((s) => s.updateTimerState);
  const stopPlayback = useAppStore((s) => s.stop);

  // Keep duration ref in sync
  useEffect(() => {
    timerDurationRef.current = timerDuration;
  }, [timerDuration]);

  // Create persistent TimerController instance
  useEffect(() => {
    const engine = AudioEngine.getInstance();
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

    return () => {
      controller.stop();
      timerRef.current = null;
    };
  }, [fadeOutSeconds, updateTimerState, stopPlayback]);

  // Playback, Pause, Resume, and Restart lifecycle effect
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const isRestart = restartKey !== prevRestartKeyRef.current;
    prevRestartKeyRef.current = restartKey;
    const prevPlayback = prevPlaybackRef.current;
    prevPlaybackRef.current = playback;

    if (playback === 'playing') {
      if (isRestart) {
        // Restart requested: re-trigger engine restart & fade-in
        engine.restart().then(() => {
          if (fadeInSeconds > 0) {
            engine.fadeIn(fadeInSeconds);
          }
        });
        fadeOutTriggered.current = false;
        const initialDuration = timerDurationRef.current;
        prevDurationRef.current = initialDuration;

        if (initialDuration > 0) {
          timerRef.current?.start(initialDuration);
        } else {
          timerRef.current?.stop();
          updateTimerState({ remainingSeconds: 0, isRunning: false });
        }
      } else if (prevPlayback === 'paused') {
        // Resumed from pause
        if (timerRef.current && timerRef.current.secondsRemaining > 0) {
          timerRef.current.resume();
          updateTimerState({ isRunning: true });
        }
      } else {
        // Fresh start from stopped
        if (fadeInSeconds > 0) {
          engine.fadeIn(fadeInSeconds);
        }
        fadeOutTriggered.current = false;
        const initialDuration = timerDurationRef.current;
        prevDurationRef.current = initialDuration;

        if (initialDuration > 0) {
          timerRef.current?.start(initialDuration);
        } else {
          timerRef.current?.stop();
          updateTimerState({ remainingSeconds: 0, isRunning: false });
        }
      }
    } else if (playback === 'paused') {
      // Paused: pause timer interval, retain remainingSeconds
      timerRef.current?.pause();
      updateTimerState({ isRunning: false });
    } else {
      // Stopped
      timerRef.current?.stop();
      fadeOutTriggered.current = false;
      updateTimerState({ remainingSeconds: 0, isRunning: false });
    }
  }, [playback, restartKey, fadeInSeconds, updateTimerState]);

  // Duration change effect: smoothly adjusts the running countdown without interrupting playback
  useEffect(() => {
    if (playback === 'playing' && timerRef.current) {
      timerRef.current.adjustDuration(timerDuration, prevDurationRef.current);
    }
    prevDurationRef.current = timerDuration;
  }, [timerDuration, playback]);
}
