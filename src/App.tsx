import { useAudioEngine } from './hooks/useAudioEngine.ts'
import { useTimer } from './hooks/useTimer.ts'
import { TransportBar } from './components/TransportBar.tsx'
import { PresetBar } from './components/PresetBar.tsx'
import { FrequencyPanel } from './components/FrequencyPanel.tsx'
import { VolumePanel } from './components/VolumePanel.tsx'
import { TimerPanel } from './components/TimerPanel.tsx'
import { IntervalPanel } from './components/IntervalPanel.tsx'
import { AmbientPanel } from './components/AmbientPanel.tsx'
import { ExportButton } from './components/ExportButton.tsx'
import { VersionBar } from './components/VersionBar.tsx'
import { BlackScreen } from './components/BlackScreen.tsx'
import './App.css'

function App() {
  // Bridge Zustand store → AudioEngine singleton
  useAudioEngine();
  // Timer countdown + fade logic
  useTimer();

  return (
    <div className="app-shell">
      <VersionBar />

      <header className="app-header">
        <div className="header-brand">
          <h1>OBE Beats</h1>
          <p className="tagline">Binaural beats &amp; ambient sound generator</p>
        </div>
        <div className="header-transport">
          <TransportBar />
        </div>
        <div className="header-extras">
          <BlackScreen />
        </div>
      </header>

      {/* Quick Visual Presets Bar */}
      <PresetBar />

      <main className="app-main">
        {/* Left Column: Sound Generation & Levels */}
        <div className="app-column">
          <section className="panel" aria-label="Binaural Frequencies">
            <FrequencyPanel />
          </section>

          <section className="panel" aria-label="Volume & Balance">
            <VolumePanel />
          </section>

          <section className="panel" aria-label="Ambient Sound">
            <AmbientPanel />
          </section>
        </div>

        {/* Right Column: Session Runtime, Interval & Audio Export */}
        <div className="app-column">
          <section className="panel" aria-label="Session Timer">
            <TimerPanel />
          </section>

          <section className="panel" aria-label="Interval Sound">
            <IntervalPanel />
          </section>

          <section className="panel" aria-label="Audio Export (WAV / MP3)">
            <ExportButton />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <small>OBE Beats — use headphones for binaural brainwave entrainment</small>
      </footer>
    </div>
  )
}

export default App
