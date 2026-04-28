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
  const { value } = (await request.json()) as { value: string };

  try {
    setPref(key, value);
  } catch {
    // pref write failing silently is acceptable
  }

  return Response.json({ ok: true });
}
