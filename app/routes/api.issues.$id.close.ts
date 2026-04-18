import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';

export async function action({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string>;
}) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { id } = params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const args = ['close', id];
  if (body.reason) args.push(`--reason=${body.reason}`);

  const result = (await bdRun(args, process.cwd())) as unknown[] | Record<string, unknown> | null;
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[0] : (result ?? { ok: true }));
}
