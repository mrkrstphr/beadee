import { bdRun } from '../../../server/bd.js';
import { broadcast, suppressWatch } from '../../../server/sse.js';

export async function loader() {
  suppressWatch();
  const result = await bdRun(['memories'], process.cwd());
  return Response.json(result);
}

export async function action({ request }: { request: Request }) {
  if (request.method === 'POST') {
    const { value, key } = (await request.json()) as { value?: string; key?: string };
    if (!value?.trim()) {
      return Response.json({ error: 'Value is required' }, { status: 400 });
    }
    const args = ['remember', value.trim()];
    if (key?.trim()) args.push('--key', key.trim());
    suppressWatch();
    const result = await bdRun(args, process.cwd());
    broadcast();
    return Response.json(result);
  }

  if (request.method === 'DELETE') {
    const { key } = (await request.json()) as { key?: string };
    if (!key?.trim()) {
      return Response.json({ error: 'Key is required' }, { status: 400 });
    }
    suppressWatch();
    const result = await bdRun(['forget', key.trim()], process.cwd());
    broadcast();
    return Response.json(result);
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
