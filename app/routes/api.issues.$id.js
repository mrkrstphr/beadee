import { bdRun } from '../../server/bd.js'
import { suppressWatch, broadcast } from '../../server/sse.js'

export async function loader({ params }) {
  const { id } = params
  suppressWatch()
  const result = await bdRun(['show', id, '--long', '--readonly'], process.cwd())
  const issue = Array.isArray(result) ? result[0] : result
  if (!issue) return Response.json({ error: `Issue ${id} not found` }, { status: 404 })
  return Response.json(issue)
}

export async function action({ request, params }) {
  if (request.method !== 'PATCH') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const { id } = params
  const body = await request.json().catch(() => ({}))

  if (Object.keys(body).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const args = ['update', id]

  if (body.claim) {
    args.push('--claim')
  } else {
    if (body.title)                  args.push(`--title=${body.title}`)
    if (body.description)            args.push(`--description=${body.description}`)
    if (body.status)                 args.push(`--status=${body.status}`)
    if (body.assignee)               args.push(`--assignee=${body.assignee}`)
    if (body.priority !== undefined) args.push(`--priority=${body.priority}`)
  }

  const result = await bdRun(args, process.cwd())
  suppressWatch(); broadcast()
  return Response.json(Array.isArray(result) ? result[0] : result)
}
