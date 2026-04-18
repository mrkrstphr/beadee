import { bdRun } from '../../server/bd.js'
import { suppressWatch, broadcast } from '../../server/sse.js'

export async function loader({ request }) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const type   = url.searchParams.get('type')
  const search = url.searchParams.get('search')
  const cwd    = process.cwd()

  suppressWatch()
  const issues = await bdRun(['list', '--all', '--readonly'], cwd)

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
  const { title, description, type = 'task', priority = 2, estimate, due, notes, design, acceptance, external_ref, parent, labels } = body

  if (!title) return Response.json({ error: 'title is required' }, { status: 400 })

  const args = [
    'create',
    `--title=${title}`,
    `--type=${type}`,
    `--priority=${priority}`,
  ]
  if (description) args.push(`--description=${description}`)
  if (estimate !== undefined && estimate !== null && estimate !== '') {
    const n = Number(estimate)
    if (!Number.isNaN(n) && n >= 0) args.push(`--estimate=${Math.floor(n)}`)
  }
  if (due && String(due).trim()) args.push(`--due=${String(due).trim()}`)
  if (notes)        args.push(`--notes=${notes}`)
  if (design)       args.push(`--design=${design}`)
  if (acceptance)   args.push(`--acceptance=${acceptance}`)
  if (external_ref) args.push(`--external-ref=${external_ref}`)
  if (parent)       args.push(`--parent=${parent}`)
  if (Array.isArray(labels) && labels.length > 0) args.push(`--labels=${labels.join(',')}`)

  const result = await bdRun(args, process.cwd())
  suppressWatch(); broadcast()
  return Response.json(Array.isArray(result) ? result[0] : result)
}
