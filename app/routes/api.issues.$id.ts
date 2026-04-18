import { bdRun } from '../../server/bd.js';
import { suppressWatch, broadcast } from '../../server/sse.js';
import type { Issue } from '../types.js';

export async function loader({ params }: { params: Record<string, string> }) {
  const { id } = params;
  suppressWatch();
  let result: unknown;
  try {
    result = await bdRun(['show', id, '--long', '--readonly'], process.cwd());
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'BD_ERROR' && error.message?.includes('no issue found')) {
      return Response.json({ error: `Issue ${id} not found` }, { status: 404 });
    }
    throw err;
  }
  const issue = Array.isArray(result) ? (result as Issue[])[0] : (result as Issue);
  if (!issue) return Response.json({ error: `Issue ${id} not found` }, { status: 404 });
  return Response.json(issue);
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string>;
}) {
  const { id } = params;

  if (request.method === 'DELETE') {
    suppressWatch();
    await bdRun(['delete', id, '--force'], process.cwd());
    suppressWatch();
    broadcast();
    return Response.json({ deleted: true });
  }

  if (request.method !== 'PATCH') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    status?: string;
    assignee?: string;
    priority?: number;
    estimate?: number | null;
    due?: string | null;
    notes?: string;
    design?: string;
    acceptance?: string;
    external_ref?: string;
    parent?: string;
    labels?: string[];
    claim?: boolean;
  };

  if (Object.keys(body).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  const args = ['update', id];

  if (body.claim) {
    args.push('--claim');
  } else {
    if (body.title) args.push(`--title=${body.title}`);
    if (body.description) args.push(`--description=${body.description}`);
    if (body.status) args.push(`--status=${body.status}`);
    if (body.assignee) args.push(`--assignee=${body.assignee}`);
    if (body.priority !== undefined) args.push(`--priority=${body.priority}`);
    if (body.estimate !== undefined) {
      if (body.estimate === null) args.push('--estimate=0');
      else args.push(`--estimate=${body.estimate}`);
    }
    if (body.due !== undefined) {
      if (body.due === null || body.due === '') args.push('--due=');
      else args.push(`--due=${body.due}`);
    }
    if (body.notes !== undefined) args.push(`--notes=${body.notes}`);
    if (body.design !== undefined) args.push(`--design=${body.design}`);
    if (body.acceptance !== undefined) args.push(`--acceptance=${body.acceptance}`);
    if (body.external_ref !== undefined) args.push(`--external-ref=${body.external_ref}`);
    if (body.parent !== undefined) args.push(`--parent=${body.parent}`);
    if (Array.isArray(body.labels)) args.push(`--set-labels=${body.labels.join(',')}`);
  }

  const result = (await bdRun(args, process.cwd())) as Issue | Issue[];
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[0] : result);
}
