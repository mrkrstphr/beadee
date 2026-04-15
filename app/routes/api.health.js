import { basename } from 'node:path'
import { bdCheck, bdVersion } from '../../server/bd.js'

export async function loader() {
  const cwd = process.cwd()
  const [{ bd }, version] = await Promise.all([bdCheck(cwd), bdVersion()])
  return Response.json({ ok: true, projectName: basename(cwd), bdVersion: version, cwd, bd })
}
