import { bdRun } from '../../server/bd.js'
import { suppressWatch } from '../../server/sse.js'

export async function loader() {
  suppressWatch()
  const result = await bdRun(['status', '--readonly'], process.cwd())
  return Response.json(result)
}
