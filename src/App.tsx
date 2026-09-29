import { useAudioEngine } from './hooks/useAudioEngine.ts'
import { useTimer } from './hooks/useTimer.ts'
import { TransportBar } from './components/TransportBar.tsx'
import { FrequencyPanel } from './components/FrequencyPanel.tsx'
import { VolumePanel } from './components/VolumePanel.tsx'
import { TimerPanel } from './components/TimerPanel.tsx'
import { AmbientPanel } from './components/AmbientPanel.tsx'
import { ExportButton } from './components/ExportButton.tsx'
import './App.css'

function App() {
  // Bridge Zustand store → AudioEngine singleton
  useAudioEngine();
  // Timer countdown + fade logic
  useTimer();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>OBE Beats</h1>
        <p className="tagline">Binaural beats &amp; ambient sound generator</p>
      </header>

      <main className="app-main">
        {/* Transport */}
        <section className="panel" aria-label="Transport controls">
          <TransportBar />
        </section>

        {/* Frequency */}
        <section className="panel" aria-label="Frequency controls">
          <FrequencyPanel />
        </section>

        {/* Volume */}
        <section className="panel" aria-label="Volume controls">
          <VolumePanel />
        </section>

        {/* Timer & Fades */}
        <section className="panel" aria-label="Timer">
          <TimerPanel />
        </section>

        {/* Ambient Sounds */}
        <section className="panel" aria-label="Ambient sounds">
          <AmbientPanel />
        </section>

        {/* WAV Export */}
        <section className="panel" aria-label="WAV Export">
          <ExportButton />
        </section>
      </main>

      <footer className="app-footer">
        <small>OBE Beats — use headphones for binaural effect</small>
      </footer>
    </div>
  )
}

export default App
