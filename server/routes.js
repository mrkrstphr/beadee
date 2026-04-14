import { watch } from 'node:fs'
import { basename, join } from 'node:path'
import { bdRun, bdCheck, bdVersion } from './bd.js'

/**
 * Wrap a route handler so bd unavailability returns 503 instead of 500.
 */
function bdHandler(fn) {
  return async (req, reply) => {
    try {
      return await fn(req, reply)
    } catch (err) {
      if (err.code === 'BD_NOT_FOUND' || err.code === 'BD_NO_BEADS_DIR') {
        return reply.code(503).send({ error: err.message })
      }
      throw err
    }
  }
}

/**
 * Register all API routes.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ cwd: string }} opts
 */
export async function registerRoutes(fastify, { cwd }) {
  // ── SSE / broadcast ──────────────────────────────────────────────────────

  const clients = new Set()
  let debounceTimer = null
  // Timestamp: suppress watch-triggered broadcasts before this time.
  // Set by read routes to avoid the feedback loop:
  //   bd list → interactions.jsonl written → watch fires → client refetches → repeat
  let suppressWatchUntil = 0

  function broadcast() {
    for (const res of clients) {
      try { res.raw.write('data: {"type":"change"}\n\n') } catch { clients.delete(res) }
    }
  }

  // Call after any bd invocation (read or write) to prevent the file-watch
  // feedback loop: bd writes interactions.jsonl → watch fires → client fetches
  // → bd writes interactions.jsonl → repeat.
  function suppressWatch() {
    suppressWatchUntil = Date.now() + 2000
  }

  // Watch .beads/ for changes made by external processes (agents, CLI).
  // Mutation routes also call broadcast() directly for immediate feedback.
  try {
    const watcher = watch(join(cwd, '.beads'), { recursive: true }, (_event, filename) => {
      if (!filename) return
      if (filename.includes('lock') || filename.endsWith('.log')) return
      // Ignore file changes triggered by our own bd read operations
      if (Date.now() < suppressWatchUntil) return
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(broadcast, 200)
    })
    watcher.on('error', () => {})
  } catch {
    // .beads/ not accessible — SSE still works via mutation broadcasts
  }

  // GET /api/events — Server-Sent Events
  fastify.get('/api/events', (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('X-Accel-Buffering', 'no')
    reply.raw.flushHeaders()

    // Initial ping so client knows connection is established
    reply.raw.write(': connected\n\n')

    clients.add(reply)

    // Keepalive comment every 30s to survive proxy timeouts
    const keepalive = setInterval(() => {
      try { reply.raw.write(': ping\n\n') } catch { clients.delete(reply); clearInterval(keepalive) }
    }, 30000)

    req.raw.on('close', () => {
      clients.delete(reply)
      clearInterval(keepalive)
    })
  })

  // ── READ ROUTES ──────────────────────────────────────────────────────────

  // GET /api/health
  fastify.get('/api/health', bdHandler(async (_req, _reply) => {
    const [{ bd }, version] = await Promise.all([bdCheck(cwd), bdVersion()])
    return { ok: true, projectName: basename(cwd), bdVersion: version, cwd, bd }
  }))

  // GET /api/issues[?status=&type=&search=]
  fastify.get('/api/issues', bdHandler(async (req, _reply) => {
    const { status, type, search } = req.query
    suppressWatch()
    const issues = await bdRun(['list', '--all'], cwd)

    let result = issues
    if (status) result = result.filter(i => i.status === status)
    if (type)   result = result.filter(i => i.issue_type === type)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.id?.toLowerCase().includes(q)
      )
    }
    return result
  }))

  // GET /api/issues/:id
  fastify.get('/api/issues/:id', bdHandler(async (req, reply) => {
    const { id } = req.params
    suppressWatch()
    const result = await bdRun(['show', id, '--long'], cwd)
    const issue = Array.isArray(result) ? result[0] : result
    if (!issue) return reply.code(404).send({ error: `Issue ${id} not found` })
    return issue
  }))

  // GET /api/ready
  fastify.get('/api/ready', bdHandler(async (_req, _reply) => {
    suppressWatch()
    return bdRun(['ready'], cwd)
  }))

  // GET /api/stats
  fastify.get('/api/stats', bdHandler(async (_req, _reply) => {
    suppressWatch()
    return bdRun(['status'], cwd)
  }))

  // ── WRITE ROUTES ─────────────────────────────────────────────────────────

  // POST /api/issues — create a new issue
  fastify.post('/api/issues', bdHandler(async (req, reply) => {
    const { title, description, type = 'task', priority = 2 } = req.body ?? {}
    if (!title) return reply.code(400).send({ error: 'title is required' })

    const args = [
      'create',
      `--title=${title}`,
      `--type=${type}`,
      `--priority=${priority}`,
    ]
    if (description) args.push(`--description=${description}`)

    const result = await bdRun(args, cwd)
    suppressWatch(); broadcast()
    return Array.isArray(result) ? result[0] : result
  }))

  // PATCH /api/issues/:id — update fields, or claim
  fastify.patch('/api/issues/:id', bdHandler(async (req, reply) => {
    const { id } = req.params
    const body = req.body ?? {}

    if (Object.keys(body).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' })
    }

    const args = ['update', id]

    if (body.claim) {
      args.push('--claim')
    } else {
      if (body.title)       args.push(`--title=${body.title}`)
      if (body.description) args.push(`--description=${body.description}`)
      if (body.status)      args.push(`--status=${body.status}`)
      if (body.assignee)    args.push(`--assignee=${body.assignee}`)
      if (body.priority !== undefined) args.push(`--priority=${body.priority}`)
    }

    const result = await bdRun(args, cwd)
    suppressWatch(); broadcast()
    return Array.isArray(result) ? result[0] : result
  }))

  // POST /api/issues/:id/close
  fastify.post('/api/issues/:id/close', bdHandler(async (req, _reply) => {
    const { id } = req.params
    const { reason } = req.body ?? {}
    const args = ['close', id]
    if (reason) args.push(`--reason=${reason}`)
    const result = await bdRun(args, cwd)
    suppressWatch(); broadcast()
    return Array.isArray(result) ? result[0] : (result ?? { ok: true })
  }))

  // POST /api/deps — add a dependency
  fastify.post('/api/deps', bdHandler(async (req, reply) => {
    const { issue, dependsOn } = req.body ?? {}
    if (!issue || !dependsOn) {
      return reply.code(400).send({ error: 'issue and dependsOn are required' })
    }
    await bdRun(['dep', 'add', issue, dependsOn], cwd)
    suppressWatch(); broadcast()
    return { ok: true }
  }))

  // DELETE /api/deps — remove a dependency
  fastify.delete('/api/deps', bdHandler(async (req, reply) => {
    const { issue, dependsOn } = req.body ?? {}
    if (!issue || !dependsOn) {
      return reply.code(400).send({ error: 'issue and dependsOn are required' })
    }
    await bdRun(['dep', 'remove', issue, dependsOn], cwd)
    suppressWatch(); broadcast()
    return { ok: true }
  }))

  // ── COMMENT ROUTES ───────────────────────────────────────────────────────

  // GET /api/issues/:id/comments
  fastify.get('/api/issues/:id/comments', bdHandler(async (req, _reply) => {
    const { id } = req.params
    suppressWatch()
    const result = await bdRun(['comments', id], cwd)
    return Array.isArray(result) ? result : []
  }))

  // POST /api/issues/:id/comments
  fastify.post('/api/issues/:id/comments', bdHandler(async (req, reply) => {
    const { id } = req.params
    const { text } = req.body ?? {}
    if (!text?.trim()) return reply.code(400).send({ error: 'text is required' })
    const result = await bdRun(['comment', id, text.trim()], cwd)
    suppressWatch(); broadcast()
    return Array.isArray(result) ? result[result.length - 1] : result
  }))
}
