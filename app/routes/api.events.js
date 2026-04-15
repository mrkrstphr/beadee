import { addController, removeController } from '../../server/sse.js'

const encoder = new TextEncoder()

export async function loader({ request }) {
  let ctrl

  const stream = new ReadableStream({
    start(c) {
      ctrl = c
      c.enqueue(encoder.encode(': connected\n\n'))
      addController(c)

      const keepalive = setInterval(() => {
        try {
          c.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          removeController(c)
          clearInterval(keepalive)
        }
      }, 30000)

      request.signal.addEventListener('abort', () => {
        removeController(c)
        clearInterval(keepalive)
      })
    },
    cancel() {
      if (ctrl) removeController(ctrl)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
