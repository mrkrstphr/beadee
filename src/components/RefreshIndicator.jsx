import { useState, useEffect } from 'react'

function timeAgo(date) {
  if (!date) return null
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5)  return 'just now'
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
}

export default function RefreshIndicator({ lastUpdated, polling }) {
  const [label, setLabel] = useState(null)

  useEffect(() => {
    if (!lastUpdated) return
    setLabel(timeAgo(lastUpdated))
    const t = setInterval(() => setLabel(timeAgo(lastUpdated)), 5000)
    return () => clearInterval(t)
  }, [lastUpdated])

  return (
    <div className="refresh-indicator" title={label ? `Updated ${label}` : 'Waiting for data…'}>
      <span className={`refresh-dot ${polling ? 'pulsing' : ''}`} />
      {label && <span className="refresh-label">Updated {label}</span>}
    </div>
  )
}
