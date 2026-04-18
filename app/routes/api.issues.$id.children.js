import { bdRun } from '../../server/bd.js';
import { suppressWatch } from '../../server/sse.js';

export async function loader({ params }) {
  const { id } = params;
  suppressWatch();
  const result = await bdRun(['children', id, '--readonly'], process.cwd());
  return Response.json(Array.isArray(result) ? result : []);
}
