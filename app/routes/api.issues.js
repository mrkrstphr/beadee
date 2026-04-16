import { bdRun } from '../../server/bd.js'
import { suppressWatch, broadcast } from '../../server/sse.js'

export async function loader({ request }) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const type   = url.searchParams.get('type')
  const search = url.searchParams.get('search')
  const cwd    = process.cwd()

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

  return Response.json(result)
}

export async function action({ request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = await request.json().catch(() => ({}))
  const { title, description, type = 'task', priority = 2 } = body

  if (!title) return Response.json({ error: 'title is required' }, { status: 400 })

  const args = [
    'create',
    `--title=${title}`,
    `--type=${type}`,
    `--priority=${priority}`,
  ]
  if (description) args.push(`--description=${description}`)

  const result = await bdRun(args, process.cwd())
  suppressWatch(); broadcast()
  return Response.json(Array.isArray(result) ? result[0] : result)
}
