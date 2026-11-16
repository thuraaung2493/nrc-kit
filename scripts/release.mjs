import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateRelease(manifest, tag) {
  if (
    typeof tag !== 'string' ||
    tag !== tag.trim() ||
    !/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(tag)
  ) {
    throw new Error('Release tags must use stable vX.Y.Z versions.');
  }

  if (tag !== `v${manifest.version}`) {
    throw new Error('The release tag must match package.json version.');
  }

  if (
    manifest.name !== '@thuraaung2493/nrc-kit' ||
    manifest.repository?.url !== 'https://github.com/thuraaung2493/nrc-kit.git'
  ) {
    throw new Error('Release package identity does not match this repository.');
  }

  return manifest.version;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  const tag = process.env.RELEASE_TAG || `v${manifest.version}`;
  const version = validateRelease(manifest, tag);
  const changelog = readFileSync('CHANGELOG.md', 'utf8');

  if (
    !changelog.split('\n').some((line) => line.startsWith(`## ${version} `))
  ) {
    throw new Error('Record the release version in CHANGELOG.md first.');
  }

  console.log(`Validated release ${tag}.`);
}
