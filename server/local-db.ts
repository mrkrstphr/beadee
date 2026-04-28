import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(join(process.cwd(), '.beads', 'beadee.db'));
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
      INSERT OR IGNORE INTO schema_version (version) VALUES (0);
      CREATE TABLE IF NOT EXISTS prefs (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    migrate(db);
  }
  return db;
}

function migrate(database: DatabaseSync): void {
  const row = database.prepare('SELECT version FROM schema_version').get() as { version: number };
  // Add future migrations here as: if (version < N) { ...; database.prepare('UPDATE schema_version SET version = N').run(); }
  if (row.version < 1) {
    database.prepare('UPDATE schema_version SET version = 1').run();
  }
}

export function getPrefs(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM prefs').all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const { key, value } of rows) map[key] = value;
  return map;
}

export function setPref(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(key, value);
}
