import { watch } from 'node:fs';
import { join } from 'node:path';

const controllers = new Set<ReadableStreamDefaultController>();
const encoder = new TextEncoder();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let suppressWatchUntil = 0;
let watcherStarted = false;

export function suppressWatch(): void {
  suppressWatchUntil = Date.now() + 2000;
}

export function broadcast(): void {
  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(encoder.encode('data: {"type":"change"}\n\n'));
    } catch {
      controllers.delete(ctrl);
    }
  }
}

export function addController(ctrl: ReadableStreamDefaultController): void {
  controllers.add(ctrl);
  ensureWatcher();
}

export function removeController(ctrl: ReadableStreamDefaultController): void {
  controllers.delete(ctrl);
}

function ensureWatcher(): void {
  if (watcherStarted) return;
  watcherStarted = true;

  const beadsDir = join(process.cwd(), '.beads');
  try {
    const watcher = watch(beadsDir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      if (filename.includes('lock') || filename.endsWith('.log')) return;
      if (Date.now() < suppressWatchUntil) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(broadcast, 200);
    });
    watcher.on('error', () => {});
  } catch {
    // .beads/ not accessible — SSE still works via mutation broadcasts
  }
}
