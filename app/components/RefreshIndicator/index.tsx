import { useState, useEffect } from 'react';
import './RefreshIndicator.css';
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
  onRefresh?: () => void;
}

export default function RefreshIndicator({
  lastUpdated,
  polling,
  onRefresh,
}: RefreshIndicatorProps) {
  const [_tick, setTick] = useState(0);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  const label = timeAgo(lastUpdated);
  const isSpinning = polling || clicking;

  function handleClick() {
    if (!onRefresh || clicking) return;
    setClicking(true);
    onRefresh();
    setTimeout(() => setClicking(false), 1000);
  }

  return (
    <div
      className={`refresh-indicator${onRefresh && !clicking ? ' refresh-indicator--clickable' : ''}`}
      title={label ? `Updated ${label}` : 'Waiting for data…'}
      onClick={handleClick}
    >
      <RefreshCw size={13} strokeWidth={1.75} className={isSpinning ? 'spinning' : ''} />
      {label && <span className="refresh-label">Updated {label}</span>}
    </div>
  );
}
