import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    // process.cwd() must stay inside getDb() — tests mock it per-case via vi.spyOn
    const beadsDir = join(process.cwd(), '.beads');
    mkdirSync(beadsDir, { recursive: true });
    db = new DatabaseSync(join(beadsDir, 'beadee.db'));
    migrate(db);
  }
  return db;
}

function migrate(database: DatabaseSync): void {
  const { user_version: version } = database.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };

  if (version < 1) {
    database.exec('CREATE TABLE prefs (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    database.exec('PRAGMA user_version = 1');
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
