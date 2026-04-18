import { basename } from 'node:path';
import { bdCheck, bdModeCheck, bdVersion } from '../../server/bd.js';

export async function loader() {
  const cwd = process.cwd();
  try {
    await bdModeCheck(cwd);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === 'BD_EMBEDDED_DOLT') {
      return Response.json({ ok: false, error: 'BD_EMBEDDED_DOLT' }, { status: 503 });
    }
    throw err;
  }
  const [{ bd }, version] = await Promise.all([bdCheck(cwd), bdVersion()]);
  return Response.json({ ok: true, projectName: basename(cwd), bdVersion: version, cwd, bd });
}
