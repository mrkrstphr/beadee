import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';

export async function action({ request }: { request: Request }) {
  const body = (await request.json().catch(() => ({}))) as {
    issue?: string;
    dependsOn?: string;
  };
  const { issue, dependsOn } = body;

  if (!issue || !dependsOn) {
    return Response.json({ error: 'issue and dependsOn are required' }, { status: 400 });
  }

  if (request.method === 'POST') {
    await bdRun(['dep', 'add', issue, dependsOn], process.cwd());
  } else if (request.method === 'DELETE') {
    await bdRun(['dep', 'remove', issue, dependsOn], process.cwd());
  } else {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  suppressWatch();
  broadcast({ affectsListView: false, affectedIds: [issue, dependsOn] });
  return Response.json({ ok: true });
}
