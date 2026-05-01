export function semverGt(a: string, b: string): boolean {
  const strip = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((s) => parseInt(s, 10));
  const pa = strip(a);
  const pb = strip(b);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}
