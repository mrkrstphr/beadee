import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

/**
 * Run a bd CLI command and return parsed JSON output.
 *
 * @param {string[]} args  - subcommand + arguments, e.g. ['list', '--status=open']
 * @param {string}   cwd   - user's project directory (where .beads/ lives)
 * @returns {Promise<any>} - parsed JSON (array or object)
 */
export async function bdRun(args, cwd) {
  let stdout
  try {
    ;({ stdout } = await execFileAsync('bd', ['--json', ...args], { cwd }))
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw Object.assign(new Error('bd not found in PATH'), { code: 'BD_NOT_FOUND' })
    }
    // bd exited non-zero — stderr has the error message
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
