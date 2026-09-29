import { useState, useEffect } from 'react';
import { version as initialVersion, lastUpdate as initialLastUpdate } from 'virtual:version';
import './VersionBar.css';

export function VersionBar() {
  const [versionInfo, setVersionInfo] = useState({
    version: initialVersion,
    lastUpdate: initialLastUpdate,
  });

  useEffect(() => {
    if (import.meta.hot) {
      const handleVersionUpdate = (data: { version: number; lastUpdate: string }) => {
        setVersionInfo(data);
      };

      import.meta.hot.on('version-update', handleVersionUpdate);

      return () => {
        import.meta.hot?.off('version-update', handleVersionUpdate);
      };
    }
  }, []);

  const displayText = `Version ${versionInfo.version} — ${versionInfo.lastUpdate}`;

  return (
    <div className="version-bar-container">
      <input
        type="text"
        readOnly
        className="version-field"
        value={displayText}
        aria-label="Application version and last update"
        title="Current version and last change"
      />
    </div>
  );
}
