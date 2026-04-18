import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';

export async function loader() {
  suppressWatch();
  const result = await bdRun(['memories'], process.cwd());
  return Response.json(result);
}

export async function action({ request }) {
  if (request.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  const { key } = await request.json();
  if (!key?.trim()) {
    return Response.json({ error: 'Key is required' }, { status: 400 });
  }
  suppressWatch();
  const result = await bdRun(['forget', key.trim()], process.cwd());
  broadcast();
  return Response.json(result);
}
