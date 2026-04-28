import { setPref } from '../../../server/local-db.js';

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

  const { key } = params;
  if (!key || !/^[a-z0-9-]+$/.test(key)) {
    return Response.json({ error: 'Invalid key' }, { status: 400 });
  }

  const body = (await request.json()) as { value?: unknown };
  const { value } = body;
  if (typeof value !== 'string') {
    return Response.json({ error: 'value must be a string' }, { status: 400 });
  }
  if (value.length > 4096) {
    return Response.json({ error: 'value too large' }, { status: 400 });
  }

  try {
    setPref(key, value);
  } catch (err) {
    console.warn('[prefs] write failed:', err);
    return Response.json({ error: 'Failed to write pref' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
