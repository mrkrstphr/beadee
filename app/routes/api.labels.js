import { bdRun } from '../../server/bd.js';

export async function loader() {
  const result = await bdRun(['label', 'list-all', '--readonly'], process.cwd());
  return Response.json(Array.isArray(result) ? result : []);
}
