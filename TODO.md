# OBE Beats — TODO

> Implementation checklist for the MVP.
> Each phase builds on the previous one. Items within a phase can be tackled
> in parallel where noted.

---

## Phase 0 — Project Scaffolding

- [x] Remove Vite starter content from `App.tsx`, `App.css`.
- [x] Remove unused assets (`hero.png`, `react.svg`, `vite.svg`).
- [x] Replace favicon with OBE Beats branding.
- [x] Create the `src/audio/`, `src/components/`, `src/hooks/`, `src/types/`
      directories.
- [x] Define shared TypeScript interfaces (`src/types/index.ts`).
- [x] Install Zustand and create central store (`src/store/useAppStore.ts`).
- [x] Set up a minimal App shell with placeholder sections.

---

## Phase 1 — Core Audio Engine

- [x] `AudioEngine.ts` — create / resume / close `AudioContext`.
- [x] `BinauralNode.ts` — dual-oscillator setup with channel merger.
  - [x] Accept carrier frequency and beat frequency.
  - [x] Compute L = carrier − beat/2, R = carrier + beat/2.
  - [x] Expose methods to update frequencies in real time.
- [x] Per-ear `GainNode`s for independent L/R volume.
- [x] Master `GainNode` for overall volume.
- [x] `play()` and `stop()` lifecycle.
- [ ] Manual smoke test: hear a binaural beat in headphones.

---

## Phase 2 — Basic UI (Transport + Frequency)

- [x] `TransportBar.tsx` — Play / Stop button.
- [x] `FrequencyPanel.tsx` — Beat frequency slider + numeric input.
- [x] `FrequencyPanel.tsx` — Carrier frequency slider + numeric input.
- [x] Wire UI state to `AudioEngine` via `useAudioEngine` hook.
- [x] Display current L/R frequencies as read-only labels.

---

## Phase 3 — Volume Controls

- [x] `VolumePanel.tsx` — Master volume slider.
- [x] `VolumePanel.tsx` — Left ear volume slider.
- [x] `VolumePanel.tsx` — Right ear volume slider.
- [x] Hook volume sliders to the engine's gain nodes.

---

## Phase 4 — Timer & Fades

- [x] `TimerController.ts` — countdown logic with tick callback.
- [x] `FadeController.ts` — fade-in ramp helper.
- [x] `FadeController.ts` — fade-out ramp helper.
- [x] `TimerPanel.tsx` — duration input (minutes).
- [x] `TimerPanel.tsx` — visual countdown display (mm:ss).
- [x] `TimerPanel.tsx` — fade-in / fade-out duration inputs.
- [x] `useTimer` hook — glue React state to `TimerController`.
- [x] On timer expiry: trigger fade-out → stop.

---

## Phase 5 — Ambient Sounds

- [x] Source or create ambient loop assets (programmatic white, pink, and brown noise; placeholders for nature sounds).
- [x] `AmbientPlayer.ts` — load, decode, loop audio buffers with buffer caching.
- [x] Route ambient layer through its own `GainNode` → master.
- [x] `AmbientPanel.tsx` — grouped dropdown selector matching user design.
- [x] `AmbientPanel.tsx` — ambient volume slider.
- [x] Include ambient layers in timer fade-in / fade-out (routed through master gain).

---

## Phase 6 — WAV Export

- [x] `WavExporter.ts` — build an `OfflineAudioContext` mirroring the live graph.
- [x] Render the offline context for the chosen duration.
- [x] Encode the `AudioBuffer` as a WAV blob (PCM 16-bit, 44.1 kHz).
- [x] `ExportButton.tsx` — trigger export, show progress, download file.
- [x] Include ambient layers in the offline render.

---

## Phase 7 — Responsive & Polish

- [x] Mobile-first responsive layout (≥ 320 px support, responsive padding & typography).
- [x] Touch-friendly slider / button sizes (≥ 44 × 44 px touch target hit-boxes on sliders and buttons).
- [x] Dark-mode theming (dark-first with system light-mode overrides).
- [x] Keyboard accessibility for all controls (`aria-label`, `aria-live`, label associations, focus rings).
- [x] Production build audit: 74 kB gzipped bundle, 0 lint errors, 0 type errors.
- [x] Final cleanup: starter code completely removed, clean component architecture.

---

## Future Ideas (Post-MVP)

- Preset library (save / load parameter sets).
- Shareable URLs with encoded parameters.
- Isochronic tones mode.
- Visualization (waveform or frequency spectrum).
- PWA support (offline use, installable).
