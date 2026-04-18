import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function bdRun(args: string[], cwd: string): Promise<unknown> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync('bd', ['--json', ...args], { cwd }));
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { stderr?: string; exitCode?: number };
    if (error.code === 'ENOENT') {
      throw Object.assign(new Error('bd not found in PATH'), { code: 'BD_NOT_FOUND' });
    }
    const message = (error.stderr || error.message || '').trim();
    throw Object.assign(new Error(`bd error: ${message}`), {
      code: 'BD_ERROR',
      exitCode: error.code,
      stderr: error.stderr,
    });
  }

  const text = stdout.trim();
  if (!text) return [];

  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error(`bd returned non-JSON output: ${text.slice(0, 200)}`), {
      code: 'BD_PARSE_ERROR',
    });
  }
}

export async function bdVersion(): Promise<string> {
  try {
    const { stdout } = await execFileAsync('bd', ['version']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

export async function bdCheck(cwd: string): Promise<{ bd: string; beads: boolean }> {
  let bdPath: string;
  try {
    const { stdout } = await execFileAsync('which', ['bd']);
    bdPath = stdout.trim();
  } catch {
    throw Object.assign(new Error('bd not found in PATH'), { code: 'BD_NOT_FOUND' });
  }

  const beadsDir = join(cwd, '.beads');
  try {
    await access(beadsDir);
  } catch {
    throw Object.assign(new Error(`.beads/ not found in ${cwd} — is this a beads project?`), {
      code: 'BD_NO_BEADS_DIR',
      cwd,
    });
  }

  return { bd: bdPath, beads: true };
}

export async function bdModeCheck(cwd: string): Promise<void> {
  const metadataPath = join(cwd, '.beads', 'metadata.json');
  try {
    const raw = await readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(raw) as { dolt_mode?: string };
    if (metadata.dolt_mode === 'embedded') {
      throw Object.assign(new Error('BD_EMBEDDED_DOLT'), { code: 'BD_EMBEDDED_DOLT', cwd });
    }
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'BD_EMBEDDED_DOLT') throw err;
  }
}
