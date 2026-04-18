import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';
import type { Comment } from '../types.js';

export async function loader({ params }: { params: Record<string, string> }) {
  const { id } = params;
  suppressWatch();
  const result = (await bdRun(['comments', id, '--readonly'], process.cwd())) as Comment[];
  return Response.json(Array.isArray(result) ? result : []);
}

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
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const text = body.text?.trim();
  if (!text) return Response.json({ error: 'text is required' }, { status: 400 });

  const result = (await bdRun(['comment', id, text], process.cwd())) as Comment[];
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[result.length - 1] : result);
}
