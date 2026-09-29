# OBE Beats — Architecture

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser Tab                      │
│                                                     │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  React UI    │◄──►│  Audio Engine (singleton)  │  │
│  │  Components  │    │  Web Audio API graph       │  │
│  └──────┬───────┘    └────────────┬──────────────┘  │
│         │                        │                  │
│         ▼                        ▼                  │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  App State   │    │  OfflineAudioContext       │  │
│  │  (React)     │    │  (WAV export)              │  │
│  └──────────────┘    └───────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 2. Existing Project Scaffold

| File / Dir | Purpose |
|------------|---------|
| `index.html` | SPA entry point; mounts `#root`. |
| `src/main.tsx` | React root render (`StrictMode` + `<App />`). |
| `src/App.tsx` | Default Vite+React starter (counter demo). Will be replaced. |
| `src/App.css` | Starter component styles. Will be replaced. |
| `src/index.css` | Global styles, CSS custom properties, dark mode. To be adapted. |
| `src/assets/` | Starter logos (`hero.png`, `react.svg`, `vite.svg`). Can be removed. |
| `public/` | `favicon.svg`, `icons.svg`. Favicon to be replaced with OBE branding. |
| `vite.config.ts` | Minimal Vite config with `@vitejs/plugin-react`. |
| `tsconfig*.json` | TypeScript project references (app + node). ES2023 target. |
| `eslint.config.js` | Flat ESLint config with React Hooks + React Refresh plugins. |
| `package.json` | React 19, Vite 8, TypeScript 6. No audio libraries yet. |

## 3. Proposed Source Layout

```
src/
├── main.tsx                  # Entry point (keep as-is)
├── App.tsx                   # Root component: layout shell + routing
├── App.css                   # Top-level layout styles
├── index.css                 # CSS reset, custom properties, dark mode
│
├── audio/                    # ── Audio engine (pure TS, no React) ──
│   ├── AudioEngine.ts        # Singleton: manages AudioContext lifecycle
│   ├── BinauralNode.ts       # Creates L/R oscillators for binaural beat
│   ├── AmbientPlayer.ts      # Loads & loops ambient audio buffers
│   ├── FadeController.ts     # Gain ramp helpers (fade-in / fade-out)
│   ├── TimerController.ts    # Session countdown + auto-stop logic
│   └── WavExporter.ts        # OfflineAudioContext → WAV Blob
│
├── store/                    # ── Zustand state management ──
│   └── useAppStore.ts        # Central store (transport, freq, vol, timer, etc.)
│
├── components/               # ── React UI components ──
│   ├── TransportBar.tsx      # Play / Stop button
│   ├── FrequencyPanel.tsx    # Beat & carrier frequency knobs/sliders
│   ├── VolumePanel.tsx       # Master, L, R volume sliders
│   ├── AmbientPanel.tsx      # Ambient sound selector + per-layer volume
│   ├── TimerPanel.tsx        # Duration input, countdown display, fade controls
│   └── ExportButton.tsx      # Trigger WAV export + download
│
├── hooks/                    # ── Custom React hooks ──
│   ├── useAudioEngine.ts     # Provides engine instance + React bindings
│   └── useTimer.ts           # Countdown state + callbacks
│
├── types/                    # ── Shared TypeScript types ──
│   └── index.ts              # Interfaces for engine params, UI state, etc.
│
└── assets/                   # ── Static assets ──
    └── ambient/              # Bundled ambient loop files (mp3/ogg)
```

## 4. Audio Engine Design

### 4.1 Web Audio Graph

```
                        ┌────────────┐
                  ┌────►│ L Osc Node ├───► L Gain ──┐
                  │     │ (carrier −  │              │
                  │     │  beat/2 Hz) │              │
 AudioContext ────┤     └────────────┘              ├──► Channel Merger ──► Master Gain ──► destination
                  │     ┌────────────┐              │
                  └────►│ R Osc Node ├───► R Gain ──┘
                        │ (carrier +  │
                        │  beat/2 Hz) │
                        └────────────┘

  Ambient layers: AudioBufferSourceNode ──► layer Gain ──► Master Gain
```

### 4.2 Key Classes

| Class | Responsibility |
|-------|---------------|
| `AudioEngine` | Owns the `AudioContext`. Creates/destroys oscillators. Exposes `play()`, `stop()`, `setCarrier()`, `setBeat()`, `setVolume()`. |
| `BinauralNode` | Encapsulates the two oscillators + channel merger + per-ear gains. Recalculates frequencies when beat or carrier changes. |
| `AmbientPlayer` | Fetches and decodes audio files, creates looping `AudioBufferSourceNode`s, routes through individual gain nodes. |
| `FadeController` | Uses `linearRampToValueAtTime` / `exponentialRampToValueAtTime` on a `GainNode` to implement fade-in and fade-out. |
| `TimerController` | `setInterval`-based countdown. Fires callbacks at tick and at expiry. On expiry, triggers fade-out then `stop()`. |
| `WavExporter` | Mirrors the live audio graph into an `OfflineAudioContext`, renders, then encodes the resulting `AudioBuffer` as a WAV Blob. |

### 4.3 State Management

App state is managed by **Zustand** (`src/store/useAppStore.ts`), a lightweight
store library chosen for its minimal boilerplate and ability to scale as more
features are added post-MVP.

- **Single store** holds all UI state: playback, frequencies, volumes, timer
  config, ambient layer state, and export status.
- **Components** subscribe to individual slices via Zustand selectors to avoid
  unnecessary re-renders.
- **Audio engine** is a plain TypeScript singleton. A custom hook
  (`useAudioEngine`) reads store values and synchronises them to imperative
  engine method calls.
- No Redux, Context providers, or reducers needed.

## 5. Styling Strategy

- Use **plain CSS** (already in place) with CSS custom properties for theming.
- Component-specific styles in co-located `.css` files or CSS modules.
- Responsive breakpoints via `@media` queries (mobile-first where practical).
- Dark mode via `prefers-color-scheme` (already wired in `index.css`).

## 6. Build & Tooling

| Tool | Version | Notes |
|------|---------|-------|
| Vite | 8.3 | Dev server + production bundler. |
| React | 19.2 | Latest stable. |
| TypeScript | 6.0 | Strict mode via tsconfig. |
| Zustand | 5.x | Lightweight state management. |
| ESLint | 10.x | Flat config with React Hooks / Refresh plugins. |

No additional runtime dependencies are planned for the MVP. The Web Audio API
is built into all target browsers.

## 7. Deployment

- Static site: `vite build` → `dist/` folder.
- Can be hosted on any static host (Vercel, Netlify, GitHub Pages, S3, etc.).
- No server-side rendering needed.
