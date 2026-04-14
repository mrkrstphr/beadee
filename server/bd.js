import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

// Embedded Dolt is single-writer; concurrent bd calls contend for the lock.
// Retry up to this many times with exponential backoff before giving up.
const BD_LOCK_RETRIES = 4
const BD_LOCK_RETRY_BASE_MS = 80

function isLockError(err) {
  const msg = (err.stderr || err.message || '').toLowerCase()
  return msg.includes('failed to open database') || msg.includes('database is locked')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Run a bd CLI command and return parsed JSON output.
 * Automatically retries on embedded-Dolt lock contention.
 *
 * @param {string[]} args  - subcommand + arguments, e.g. ['list', '--status=open']
 * @param {string}   cwd   - user's project directory (where .beads/ lives)
 * @returns {Promise<any>} - parsed JSON (array or object)
 */
export async function bdRun(args, cwd) {
  let lastErr
  for (let attempt = 0; attempt <= BD_LOCK_RETRIES; attempt++) {
    if (attempt > 0) await sleep(BD_LOCK_RETRY_BASE_MS * 2 ** (attempt - 1))

    let stdout
    try {
      ;({ stdout } = await execFileAsync('bd', ['--json', ...args], { cwd }))
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw Object.assign(new Error('bd not found in PATH'), { code: 'BD_NOT_FOUND' })
      }
      if (isLockError(err) && attempt < BD_LOCK_RETRIES) {
        lastErr = err
        continue
      }
      const message = (err.stderr || err.message || '').trim()
      throw Object.assign(new Error(`bd error: ${message}`), {
        code: 'BD_ERROR',
        exitCode: err.code,
        stderr: err.stderr,
      })
    }

    const text = stdout.trim()
    if (!text) return []

    try {
      return JSON.parse(text)
    } catch {
      throw Object.assign(new Error(`bd returned non-JSON output: ${text.slice(0, 200)}`), {
        code: 'BD_PARSE_ERROR',
      })
    }
  }

  // Exhausted retries
  const message = (lastErr.stderr || lastErr.message || '').trim()
  throw Object.assign(new Error(`bd error (lock contention after ${BD_LOCK_RETRIES} retries): ${message}`), {
    code: 'BD_ERROR',
    exitCode: lastErr.code,
    stderr: lastErr.stderr,
  })
}

/**
 * Return the installed bd version string, or 'unknown' if unavailable.
 */
export async function bdVersion() {
  try {
    const { stdout } = await execFileAsync('bd', ['version'])
    return stdout.trim()
  } catch {
    return 'unknown'
  }
}

/**
 * Verify that bd is available in PATH and that cwd contains a .beads/ directory.
 *
 * @param {string} cwd - user's project directory
 * @returns {Promise<{ bd: string, beads: boolean }>}
 */
export async function bdCheck(cwd) {
  // Confirm bd binary exists
  let bdPath
  try {
    ;({ stdout: bdPath } = await execFileAsync('which', ['bd']))
    bdPath = bdPath.trim()
  } catch {
    throw Object.assign(new Error('bd not found in PATH'), { code: 'BD_NOT_FOUND' })
  }

  // Confirm .beads/ directory exists in the project
  const beadsDir = join(cwd, '.beads')
  try {
    await access(beadsDir)
  } catch {
    throw Object.assign(
      new Error(`.beads/ not found in ${cwd} — is this a beads project?`),
      { code: 'BD_NO_BEADS_DIR', cwd }
    )
  }

  return { bd: bdPath, beads: true }
}
