export default function ErrorScreen({ error }) {
  const isBdMissing   = error?.includes('BD_NOT_FOUND') || error?.includes('not found in PATH')
  const isNoBeads     = error?.includes('BD_NO_BEADS_DIR') || error?.includes('.beads/')

  return (
    <div className="error-screen">
      <div className="error-screen-box">
        <div className="error-screen-icon">⚠</div>
        <h2 className="error-screen-title">Cannot connect to beads</h2>
        {isBdMissing && (
          <>
            <p className="error-screen-msg"><code>bd</code> was not found in your PATH.</p>
            <p className="error-screen-hint">Install beads first, then restart beadee.</p>
          </>
        )}
        {isNoBeads && (
          <>
            <p className="error-screen-msg">No <code>.beads/</code> directory found in the current directory.</p>
            <p className="error-screen-hint">Run <code>beadee</code> from a directory that contains a beads project.</p>
          </>
        )}
        {!isBdMissing && !isNoBeads && (
          <p className="error-screen-msg">{error}</p>
        )}
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  )
}
