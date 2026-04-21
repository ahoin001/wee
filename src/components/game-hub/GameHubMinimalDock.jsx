import React, { useCallback, useEffect, useState } from 'react';
import { useActivityInterval } from '../../hooks/useActivityInterval';
import './GameHubMinimalDock.css';

/**
 * Compact dock for Game Hub space — time + settings only so the full ribbon
 * does not compete with library grid / hero.
 */
export default function GameHubMinimalDock({ onSettingsClick, timeColor = '#e8e8ea' }) {
  const [now, setNow] = useState(() => new Date());

  const tick = useCallback(() => setNow(new Date()), []);
  useEffect(() => {
    tick();
  }, [tick]);
  useActivityInterval(tick, 30000, { fireOnResume: true });

  const timeLine = `${now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} · ${now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;

  return (
    <div className="gamehub-minimal-dock" role="toolbar" aria-label="Game Hub quick bar">
      <span className="gamehub-minimal-dock__time" style={{ color: timeColor }}>
        {timeLine}
      </span>
      <button
        type="button"
        className="gamehub-minimal-dock__btn"
        onClick={onSettingsClick}
        title="Settings"
        aria-label="Open settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </div>
  );
}
