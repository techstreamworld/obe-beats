# OBE Beats — Product Specification

## 1. Vision

**OBE Beats** is a browser-based binaural-beats and ambient-sound generator.
Users open a single web page, dial in a beat frequency and carrier frequency,
press play, and experience stereo binaural beats — optionally layered with
ambient soundscapes, timed sessions, and fade effects. Sessions can be exported
as WAV files for offline listening.

## 2. Target Audience

| Persona | Need |
|---------|------|
| Meditators / lucid dreamers | Specific binaural-beat frequencies (theta, delta, gamma) for altered states. |
| Focus / study users | Background audio that aids concentration (alpha/beta beats + ambient). |
| Sound designers / curious tinkerers | Fine-grained control over carrier, beat, and volume per ear. |

## 3. MVP Feature Set

### 3.1 Binaural-Beat Engine
- **Beat-frequency control** — user sets the desired beat frequency (0.5–40 Hz).
  The engine derives left/right oscillator frequencies from the carrier ± half
  the beat frequency.
- **Carrier-frequency control** — adjustable base tone (20–1500 Hz).
- **Separate left/right tones** — each ear receives an independent sine wave at
  the computed frequency. Stereo separation is mandatory for the binaural effect.

### 3.2 Transport Controls
- **Play / Stop** — start and stop audio generation with a single button.
- The Web Audio `AudioContext` is created (or resumed) on the first user
  gesture to comply with browser autoplay policies.

### 3.3 Volume Controls
- **Master volume** slider.
- **Independent left / right volume** sliders so the user can balance or mute
  one ear.
- **Ambient volume** slider (per ambient layer).

### 3.4 Timer & Fades
- **Session timer** — user sets a duration (minutes); playback auto-stops when
  time elapses. A visual countdown is displayed.
- **Fade-in** — ramp from silence to target volume over a configurable number of
  seconds.
- **Fade-out** — ramp from current volume to silence before auto-stop.

### 3.5 Ambient Sounds
- A selectable set of bundled ambient loops (e.g., rain, ocean waves, forest,
  white noise, pink noise).
- Multiple ambient layers can play simultaneously.
- Each layer has its own on/off toggle and volume slider.

### 3.6 WAV Export
- Offline-render the current session parameters to a WAV file entirely in the
  browser.
- User chooses export duration.
- File is downloaded via a generated `<a>` link (no server needed).

### 3.7 Responsive Mobile Layout
- The UI must be fully usable on phone-sized screens (≥ 320 px wide).
- Touch-friendly controls (large tap targets, no hover-only interactions).
- Desktop layout may use a wider two-column arrangement.

## 4. Non-Goals (MVP)

- User accounts or cloud sync.
- Preset management or shareable URLs (may be added later).
- MIDI / external controller input.
- Multi-tab / multi-device sync.
- Native mobile app wrappers.

## 5. Technical Constraints

| Constraint | Detail |
|------------|--------|
| Runtime | 100 % client-side; no backend server. |
| Audio API | Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `OfflineAudioContext`). |
| Browser support | Latest two major versions of Chrome, Firefox, Safari, Edge. |
| Framework | React 19 + TypeScript + Vite (already scaffolded). |
| Bundle size | Keep small; avoid heavy UI frameworks. Prefer CSS modules or plain CSS. |

## 6. Success Criteria

1. User can generate audible binaural beats in headphones within 3 clicks of
   opening the page.
2. All controls respond in real time with no audible glitches.
3. WAV export produces a valid file that plays correctly in any media player.
4. Lighthouse mobile performance score ≥ 90.
