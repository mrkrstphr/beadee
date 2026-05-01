import { describe, it, expect } from 'vitest';
import { semverGt } from './semver';

describe('semverGt', () => {
  it('returns true when major is greater', () => {
    expect(semverGt('2.0.0', '1.9.9')).toBe(true);
  });

  it('returns true when minor is greater', () => {
    expect(semverGt('1.2.0', '1.1.9')).toBe(true);
  });

  it('returns true when patch is greater', () => {
    expect(semverGt('1.0.2', '1.0.1')).toBe(true);
  });

  it('returns false when equal', () => {
    expect(semverGt('1.2.3', '1.2.3')).toBe(false);
  });

  it('returns false when less than', () => {
    expect(semverGt('1.0.0', '2.0.0')).toBe(false);
  });

  it('strips leading v prefix', () => {
    expect(semverGt('v2.0.0', 'v1.0.0')).toBe(true);
    expect(semverGt('v1.0.0', 'v1.0.0')).toBe(false);
  });

  it('handles mixed v prefix', () => {
    expect(semverGt('v1.1.0', '1.0.0')).toBe(true);
  });

  it('treats missing segments as 0', () => {
    expect(semverGt('1.1', '1.0.9')).toBe(true);
    expect(semverGt('1.0', '1.0.0')).toBe(false);
  });
});
