import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

function timeAgo(date: Date | null): string | null {
  if (!date) return null;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

interface RefreshIndicatorProps {
  lastUpdated: Date | null;
  polling: boolean;
}

export default function RefreshIndicator({ lastUpdated, polling }: RefreshIndicatorProps) {
  const [_tick, setTick] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  const label = timeAgo(lastUpdated);

  return (
    <div className="refresh-indicator" title={label ? `Updated ${label}` : 'Waiting for data…'}>
      <RefreshCw size={13} strokeWidth={1.75} className={polling ? 'spinning' : ''} />
      {label && <span className="refresh-label">Updated {label}</span>}
    </div>
  );
}
