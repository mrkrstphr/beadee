import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';

export async function action({ request, params }) {
  const { id } = params;
  const body = await request.json().catch(() => ({}));
  const { label } = body;

  if (!label) {
    return Response.json({ error: 'label is required' }, { status: 400 });
  }

  if (request.method === 'POST') {
    await bdRun(['label', 'add', id, label], process.cwd());
  } else if (request.method === 'DELETE') {
    await bdRun(['label', 'remove', id, label], process.cwd());
  } else {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  suppressWatch();
  broadcast();
  return Response.json({ ok: true });
}
