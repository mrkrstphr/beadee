import { bdRun } from '../../../server/bd.js';
import { suppressWatch } from '../../../server/sse.js';
import type { Issue } from '../../types.js';

export async function loader({ params }: { params: Record<string, string> }) {
  const { id } = params;
  suppressWatch();
  const result = (await bdRun(['children', id, '--readonly'], process.cwd())) as Issue[];
  return Response.json(Array.isArray(result) ? result : []);
}
