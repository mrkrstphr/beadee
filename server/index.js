import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import openUrl from 'open'
import { bdCheck } from './bd.js'
import { registerRoutes } from './routes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Find a free port by binding to port 0 and immediately closing.
 * @returns {Promise<number>}
 */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

/**
 * Start the beadee server.
 *
 * @param {object} opts
 * @param {number}  opts.port  - port to listen on; 0 = pick a free port
 * @param {string}  opts.host  - hostname / bind address
 * @param {boolean} opts.open  - open browser after start
 * @param {boolean} opts.dev   - dev mode (skip static serving; Vite handles it)
 */
export async function startServer({ port = 3001, host = 'localhost', open = false, dev = false } = {}) {
  const cwd = process.cwd()

  // Verify bd is available before starting
  await bdCheck(cwd)

  const fastify = Fastify({ logger: false })

  // CORS — always on so the Vite dev server can reach the API
  await fastify.register(cors, { origin: true })

  // Serve built frontend in production mode
  if (!dev) {
    const distDir = join(__dirname, '..', 'dist')
    await fastify.register(staticPlugin, {
      root: distDir,
      prefix: '/',
    })

    // SPA fallback — serve index.html for any unmatched route
    fastify.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html')
    })
  }

  // API routes
  await registerRoutes(fastify, { cwd })

  const listenPort = port === 0 ? await getFreePort() : port
  await fastify.listen({ port: listenPort, host })

  const url = `http://${host}:${listenPort}`

  // Startup banner
  const projectName = cwd.split('/').pop()
  console.log('')
  console.log('  beadee')
  console.log(`  project : ${projectName}`)
  console.log(`  url     : ${url}`)
  console.log(`  mode    : ${dev ? 'dev' : 'production'}`)
  console.log('')

  if (open) {
    await openUrl(url)
  }

  return { fastify, url, port: listenPort }
}
