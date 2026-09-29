// ─── useAudioEngine ───
// Bridges the Zustand store to the AudioEngine singleton.
// Subscribes to store slices and pushes changes to the engine.

import { useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { useAppStore } from '../store/useAppStore.ts';

export function useAudioEngine(): void {
  const playback = useAppStore((s) => s.playback);
  const carrierFrequency = useAppStore((s) => s.carrierFrequency);
  const beatFrequency = useAppStore((s) => s.beatFrequency);
  const masterVolume = useAppStore((s) => s.masterVolume);
  const leftVolume = useAppStore((s) => s.leftVolume);
  const rightVolume = useAppStore((s) => s.rightVolume);
  const selectedAmbientId = useAppStore((s) => s.selectedAmbientId);
  const ambientVolume = useAppStore((s) => s.ambientVolume);

  // ── Sync playback state ──
  useEffect(() => {
    const engine = AudioEngine.getInstance();
    if (playback === 'playing') {
      engine.play();
    } else {
      engine.stop();
    }
  }, [playback]);

  // ── Sync frequencies ──
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

  // ── Sync ambient ──
  useEffect(() => {
    AudioEngine.getInstance().setAmbient(selectedAmbientId);
  }, [selectedAmbientId]);

  useEffect(() => {
    AudioEngine.getInstance().setAmbientVolume(ambientVolume);
  }, [ambientVolume]);
}
