import { version as currentVersion } from '../../package.json'

function semverGt(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true
    if ((pa[i] || 0) < (pb[i] || 0)) return false
  }
  return false
}

export async function loader() {
  try {
    const npmRes = await fetch('https://registry.npmjs.org/@mrkrstphr/beadee/latest', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!npmRes.ok) return Response.json({ hasUpdate: false, currentVersion })

    const { version: latestVersion } = await npmRes.json()
    const hasUpdate = semverGt(latestVersion, currentVersion)

    let changelog = null
    let releaseUrl = null
    if (hasUpdate) {
      const ghRes = await fetch(
        `https://api.github.com/repos/mrkrstphr/beadee/releases/tags/v${latestVersion}`,
        { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000) }
      )
      if (ghRes.ok) {
        const release = await ghRes.json()
        changelog = release.body || null
        releaseUrl = release.html_url || null
      }
    }

    return Response.json({ hasUpdate, currentVersion, latestVersion, changelog, releaseUrl })
  } catch {
    return Response.json({ hasUpdate: false, currentVersion })
  }
}
