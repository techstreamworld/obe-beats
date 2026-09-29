# OBE Beats — Agent Roles

> How the work can be divided across specialised coding agents when
> implementing the MVP. Each agent owns a clear boundary; coordination
> happens through the shared type definitions in `src/types/index.ts` and the
> public API of `AudioEngine`.

---

## Agent 1 — Audio Engine Developer

**Scope:** Everything under `src/audio/`.

**Responsibilities:**
- Implement `AudioEngine.ts` (singleton, `AudioContext` lifecycle).
- Implement `BinauralNode.ts` (dual oscillators, channel merger, per-ear gain).
- Implement `AmbientPlayer.ts` (decode, loop, gain-route ambient buffers).
- Implement `FadeController.ts` (gain ramp helpers).
- Implement `TimerController.ts` (countdown + auto-stop).
- Implement `WavExporter.ts` (offline render → WAV blob).

**Deliverables:**
- Fully tested audio engine with a clean imperative API.
- No React imports — pure TypeScript only.

**Key interfaces consumed:**
- `EngineParams`, `AmbientLayerConfig` from `src/types/index.ts`.

---

## Agent 2 — UI / Component Developer

**Scope:** Everything under `src/components/` and `src/hooks/`, plus `App.tsx`.

**Responsibilities:**
- Build `TransportBar`, `FrequencyPanel`, `VolumePanel`, `AmbientPanel`,
  `TimerPanel`, `ExportButton` components.
- Build `useAudioEngine` and `useTimer` hooks.
- Wire component state to the `AudioEngine` API.
- Ensure keyboard and screen-reader accessibility.
- Implement responsive layout (mobile-first CSS).

**Deliverables:**
- Working React UI that drives the audio engine.
- Accessible, responsive, dark-mode-aware component set.

**Key interfaces consumed:**
- `AudioEngine` public methods (play, stop, setters).
- Shared types from `src/types/index.ts`.

---

## Agent 3 — Styling / Layout Agent

**Scope:** `src/index.css`, `src/App.css`, and any component `.css` files.

**Responsibilities:**
- Define the overall visual identity (color palette, typography, spacing).
- Maintain CSS custom properties for light/dark themes.
- Ensure all components meet responsive breakpoints (≥ 320 px).
- Verify touch-friendly target sizes (≥ 44 × 44 px).
- Run Lighthouse audits and fix any accessibility/performance issues.

**Deliverables:**
- Polished, consistent stylesheet.
- Passing Lighthouse scores (performance ≥ 90, accessibility ≥ 90).

---

## Agent 4 — Integration & QA

**Scope:** Cross-cutting concerns.

**Responsibilities:**
- Define and maintain `src/types/index.ts` (shared interfaces).
- Integrate Agent 1 and Agent 2 deliverables.
- Write integration tests (if test framework is added).
- Verify WAV export output in external players.
- Verify binaural-beat accuracy (L/R frequency difference = beat frequency).
- Final cleanup: remove starter code, audit bundle size, check linting.

**Deliverables:**
- A shippable, linted, production-built MVP.

---

## Coordination Contract

| Artefact | Owner | Consumers |
|----------|-------|-----------|
| `src/types/index.ts` | Agent 4 | All |
| `AudioEngine` public API | Agent 1 | Agent 2, Agent 4 |
| Component prop interfaces | Agent 2 | Agent 3 |
| CSS custom properties | Agent 3 | Agent 2 |

### Communication Protocol
1. **Types first** — Agent 4 drafts shared interfaces before implementation
   begins.
2. **API stub** — Agent 1 exports a stub `AudioEngine` class with typed
   method signatures so Agent 2 can code against it immediately.
3. **CSS variables** — Agent 3 publishes the variable names and semantics
   before Agent 2 references them in components.
4. **Integration gate** — Agent 4 merges and smoke-tests after each phase
   listed in `TODO.md`.
