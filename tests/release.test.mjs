import { describe, expect, it } from 'vitest';
import { validateRelease } from '../scripts/release.mjs';

const manifest = {
  name: '@thuraaung2493/nrc-kit',
  version: '0.1.1',
  repository: { url: 'https://github.com/thuraaung2493/nrc-kit.git' },
};

describe('release validation', () => {
  it('accepts a stable tag matching the package version', () => {
    expect(validateRelease(manifest, 'v0.1.1')).toBe('0.1.1');
  });

  it.each(['0.1.1', 'v01.1.1', 'v0.1.1-beta.1', 'v0.1.1/other', 'v0.1.1\n'])(
    'rejects malformed or prerelease tags: %s',
    (tag) => {
      expect(() => validateRelease(manifest, tag)).toThrow('stable vX.Y.Z');
    },
  );

  it('rejects a tag that differs from the package version', () => {
    expect(() => validateRelease(manifest, 'v0.2.0')).toThrow('must match');
  });

  it('rejects a package name or repository mismatch', () => {
    expect(() =>
      validateRelease({ ...manifest, name: 'another-package' }, 'v0.1.1'),
    ).toThrow('identity');

    expect(() =>
      validateRelease({ ...manifest, repository: { url: 'other' } }, 'v0.1.1'),
    ).toThrow('identity');
  });
});
