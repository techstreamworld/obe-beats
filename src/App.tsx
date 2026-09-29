import { useAudioEngine } from './hooks/useAudioEngine.ts'
import { useTimer } from './hooks/useTimer.ts'
import { TransportBar } from './components/TransportBar.tsx'
import { FrequencyPanel } from './components/FrequencyPanel.tsx'
import { VolumePanel } from './components/VolumePanel.tsx'
import { TimerPanel } from './components/TimerPanel.tsx'
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

      <main className="app-main">
        {/* Left Column: Sound Generation & Levels */}
        <div className="app-column">
          <section className="panel" aria-labelledby="heading-frequencies">
            <h2 id="heading-frequencies" className="panel-title">Binaural Frequencies</h2>
            <FrequencyPanel />
          </section>

          <section className="panel" aria-labelledby="heading-volume">
            <h2 id="heading-volume" className="panel-title">Volume &amp; Balance</h2>
            <VolumePanel />
          </section>

          <section className="panel" aria-labelledby="heading-ambient">
            <h2 id="heading-ambient" className="panel-title">Ambient Sound</h2>
            <AmbientPanel />
          </section>
        </div>

        {/* Right Column: Session Runtime & Audio Export */}
        <div className="app-column">
          <section className="panel" aria-labelledby="heading-timer">
            <h2 id="heading-timer" className="panel-title">Session Timer &amp; Master Track Fades</h2>
            <TimerPanel />
          </section>

          <section className="panel" aria-labelledby="heading-export">
            <h2 id="heading-export" className="panel-title">Audio Export (WAV / MP3)</h2>
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
