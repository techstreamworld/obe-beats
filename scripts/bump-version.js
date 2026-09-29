import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const versionPath = path.resolve(__dirname, '..', 'version.json');

const reason = process.argv.slice(2).join(' ') || 'Manual update';

let data = {
  version: 1,
  lastUpdate: 'Initial release with binaural audio, ambient noise, timer & WAV export',
};

if (fs.existsSync(versionPath)) {
  try {
    data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
  } catch (err) {
    console.error('Error reading version.json:', err);
  }
}

data.version += 1;
data.lastUpdate = reason;

fs.writeFileSync(versionPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`✓ Bumped to Version ${data.version}: ${data.lastUpdate}`);
