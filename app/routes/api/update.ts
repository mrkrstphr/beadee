import { version as currentVersion } from '../../../package.json';

interface NpmPackageInfo {
  version: string;
}

interface GithubRelease {
  tag_name?: string;
  body?: string;
  html_url?: string;
}

export interface ReleaseEntry {
  version: string;
  changelog: string | null;
  releaseUrl: string | null;
}

function stripV(v: string): string {
  return v.replace(/^v/, '');
}

function semverGt(a: string, b: string): boolean {
  const pa = stripV(a).split('.').map(Number);
  const pb = stripV(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

export async function loader() {
  try {
    const npmRes = await fetch('https://registry.npmjs.org/@mrkrstphr/beadee/latest', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!npmRes.ok) return Response.json({ hasUpdate: false, currentVersion });

    const { version: latestVersion } = (await npmRes.json()) as NpmPackageInfo;
    const hasUpdate = semverGt(latestVersion, currentVersion);

    let releases: ReleaseEntry[] = [];
    if (hasUpdate) {
      const ghRes = await fetch('https://api.github.com/repos/mrkrstphr/beadee/releases', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(5000),
      });
      if (ghRes.ok) {
        const all = (await ghRes.json()) as GithubRelease[];
        releases = all
          .filter((r) => r.tag_name && semverGt(r.tag_name, currentVersion))
          .sort((a, b) => {
            if (semverGt(a.tag_name!, b.tag_name!)) return -1;
            if (semverGt(b.tag_name!, a.tag_name!)) return 1;
            return 0;
          })
          .map((r) => ({
            version: stripV(r.tag_name!),
            changelog: r.body || null,
            releaseUrl: r.html_url || null,
          }));
      }
    }

    return Response.json({ hasUpdate, currentVersion, latestVersion, releases });
  } catch {
    return Response.json({ hasUpdate: false, currentVersion });
  }
}
