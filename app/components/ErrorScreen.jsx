export default function ErrorScreen({ error }) {
  const isBdMissing = error?.includes('BD_NOT_FOUND') || error?.includes('not found in PATH');
  const isNoBeads = error?.includes('BD_NO_BEADS_DIR') || error?.includes('.beads/');
  const isEmbeddedDolt = error?.includes('BD_EMBEDDED_DOLT');

  return (
    <div className="error-screen">
      <div className="error-screen-box">
        <div className="error-screen-icon">⚠</div>
        <h2 className="error-screen-title">Cannot connect to beads</h2>
        {isBdMissing && (
          <>
            <p className="error-screen-msg">
              <code>bd</code> was not found in your PATH.
            </p>
            <p className="error-screen-hint">Install beads first, then restart beadee.</p>
          </>
        )}
        {isNoBeads && (
          <>
            <p className="error-screen-msg">
              No <code>.beads/</code> directory found in the current directory.
            </p>
            <p className="error-screen-hint">
              Run <code>beadee</code> from a directory that contains a beads project.
            </p>
          </>
        )}
        {isEmbeddedDolt && (
          <>
            <p className="error-screen-msg">
              This project uses embedded Dolt. beadee requires dolt server mode.
            </p>
            <div className="error-screen-migration">
              <p className="error-screen-hint">To migrate to dolt server mode:</p>
              <ol className="error-screen-steps">
                <li>
                  Back up your existing project:
                  <pre>{'bd backup init /path/to/backup-dir\nbd backup sync'}</pre>
                </li>
                <li>
                  Create a new server-mode project and restore:
                  <pre>
                    {
                      'mkdir /path/to/new-project && cd /path/to/new-project\nbd init --server\nbd backup restore --force /path/to/backup-dir'
                    }
                  </pre>
                </li>
                <li>
                  Verify, then launch beadee from the new directory:
                  <pre>{'bd list\nbeadee'}</pre>
                </li>
              </ol>
            </div>
          </>
        )}
        {!isBdMissing && !isNoBeads && !isEmbeddedDolt && (
          <p className="error-screen-msg">{error}</p>
        )}
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  );
}
