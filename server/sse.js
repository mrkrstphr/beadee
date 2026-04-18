import { watch } from 'node:fs';
import { join } from 'node:path';

// Module-level SSE state — persists for the lifetime of the server process.
// Mutation routes call suppressWatch() + broadcast(); the fs.watch handles
// changes from external processes (agents, CLI).

const controllers = new Set();
const encoder = new TextEncoder();
let debounceTimer = null;
let suppressWatchUntil = 0;
let watcherStarted = false;

export function suppressWatch() {
  suppressWatchUntil = Date.now() + 2000;
}

export function broadcast() {
  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(encoder.encode('data: {"type":"change"}\n\n'));
    } catch {
      controllers.delete(ctrl);
    }
  }
}

export function addController(ctrl) {
  controllers.add(ctrl);
  ensureWatcher();
}

export function removeController(ctrl) {
  controllers.delete(ctrl);
}

function ensureWatcher() {
  if (watcherStarted) return;
  watcherStarted = true;

  const beadsDir = join(process.cwd(), '.beads');
  try {
    const watcher = watch(beadsDir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      if (filename.includes('lock') || filename.endsWith('.log')) return;
      if (Date.now() < suppressWatchUntil) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(broadcast, 200);
    });
    watcher.on('error', () => {});
  } catch {
    // .beads/ not accessible — SSE still works via mutation broadcasts
  }
}
