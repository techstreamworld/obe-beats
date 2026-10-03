// ─── useAudioEngine ───
// Bridges the Zustand store to the AudioEngine singleton.
// Subscribes to store slices and pushes changes to the engine.

import { useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useAudioEngine(): void {
  const playback = useAppStore((s) => s.playback);
  const restartKey = useAppStore((s) => s.restartKey);
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
  const setIsIntervalPreviewing = useAppStore((s) => s.setIsIntervalPreviewing);
  const timerDurationSeconds = useAppStore((s) => s.timerDurationSeconds);

  // ── Sync playback state ──
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (playback === 'playing') {
      engine.play();
    } else if (playback === 'paused') {
      engine.pause();
    } else {
      engine.stop();
    }
  }, [playback, restartKey]);

  // ── Sync binaural beats enabled & frequencies ──
  useEffect(() => {
    AudioEngine.getInstance().setBinauralEnabled(binauralEnabled);
  }, [binauralEnabled]);

  useEffect(() => {
    AudioEngine.getInstance().setBinauralVolume(binauralVolume);
  }, [binauralVolume]);

  useEffect(() => {
    AudioEngine.getInstance().setCarrierFrequency(carrierFrequency);
  }, [carrierFrequency]);

  useEffect(() => {
    AudioEngine.getInstance().setBeatFrequency(beatFrequency);
  }, [beatFrequency]);

  // ── Sync volumes ──
  useEffect(() => {
    AudioEngine.getInstance().setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    AudioEngine.getInstance().setLeftVolume(leftVolume);
  }, [leftVolume]);

  useEffect(() => {
    AudioEngine.getInstance().setRightVolume(rightVolume);
  }, [rightVolume]);

  // ── Sync ambient sound ──
  useEffect(() => {
    AudioEngine.getInstance().setAmbientEnabled(ambientEnabled);
  }, [ambientEnabled]);

  useEffect(() => {
    AudioEngine.getInstance().setAmbientLayers(ambientLayers);
  }, [ambientLayers]);

  // ── Sync session duration ──
  useEffect(() => {
    AudioEngine.getInstance().setSessionDuration(timerDurationSeconds);
  }, [timerDurationSeconds]);

  // ── Sync interval layer ──
  useEffect(() => {
    const effectiveMinutes = intervalEnabled ? intervalMinutes : 0;
    AudioEngine.getInstance().setIntervalConfig(
      intervalTone,
      effectiveMinutes,
      intervalVolume,
      intervalRepeatCount,
    );
  }, [intervalEnabled, intervalTone, intervalMinutes, intervalVolume, intervalRepeatCount]);

  useEffect(() => {
    AudioEngine.getInstance().onIntervalPreviewChange((previewing) => {
      setIsIntervalPreviewing(previewing);
    });
  }, [setIsIntervalPreviewing]);
}
