import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function autoVersionPlugin(): Plugin {
  const versionFilePath = path.resolve(__dirname, 'version.json')

  function readVersion(): { version: number; lastUpdate: string } {
    try {
      if (fs.existsSync(versionFilePath)) {
        return JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'))
      }
    } catch (err) {
      console.error('Failed to read version.json:', err)
    }
    return {
      version: 1,
      lastUpdate: 'Initial release with binaural audio, ambient noise, timer & WAV export',
    }
  }

  function writeVersion(data: { version: number; lastUpdate: string }) {
    try {
      fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    } catch (err) {
      console.error('Failed to write version.json:', err)
    }
  }

  return {
    name: 'auto-version-plugin',
    resolveId(id) {
      if (id === 'virtual:version') {
        return '\0virtual:version'
      }
    },
    load(id) {
      if (id === '\0virtual:version') {
        const data = readVersion()
        return `export const version = ${data.version};\nexport const lastUpdate = ${JSON.stringify(data.lastUpdate)};`
      }
    },
    handleHotUpdate({ file, server }) {
      const normalizedPath = file.replace(/\\/g, '/')
      if (normalizedPath.includes('/src/') && !normalizedPath.endsWith('virtual-version.d.ts')) {
        const data = readVersion()
        data.version += 1
        const filename = path.basename(file)
        data.lastUpdate = `Updated ${filename}`
        writeVersion(data)

        const mod = server.moduleGraph.getModuleById('\0virtual:version')
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
        }

        server.ws.send({
          type: 'custom',
          event: 'version-update',
          data,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoVersionPlugin()],
})
