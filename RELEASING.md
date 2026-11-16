# Releases

This repository independently releases `@thuraaung2493/nrc-kit`.
Pushing a stable `vX.Y.Z` tag starts `release.yml`, which:

1. Requires the tagged commit to belong to `main`, the tag to match
   `package.json`, and the release to appear in `CHANGELOG.md`.
2. Runs the complete Node 22/24 and React 18.2/19 CI matrix, including
   formatting, linting, types, unit tests, clean consumers and browser checks.
3. Builds and uploads the npm archive without publishing credentials.
4. Publishes that archive to npm with OIDC and provenance in a separate job.

The `publish` job alone has `id-token: write`. Its `npm` deployment
environment permits `v*` tags only. npm trusts only
`thuraaung2493/nrc-kit`, workflow `release.yml`, environment `npm`.
No `NPM_TOKEN` or per-release npm login is needed.

## Release a version

Update `package.json` and `package-lock.json` together, record the version
in `CHANGELOG.md`, and commit and push the changes to `main`. Wait for CI
to pass, then create and push its matching tag. For example, after preparing
version 0.1.1:

```sh
git tag -a v0.1.1 -m 'Release 0.1.1'
git push origin v0.1.1
```

The workflow handles publishing. Stable tags publish to npm's `latest`
channel. Prerelease tags are rejected; they need a separately designed channel.
Do not move release tags or reuse a published version number.

Review reference-data provenance/checksums and the shared behavioral contract
when changing data or behavior. Run the optional PHP parity check when both
repositories are available. The Laravel package owns its own versions and tags.

## Check CD without publishing

```sh
gh workflow run release.yml --ref main
```

A manual run validates the current version, runs the full CI matrix, builds
the archive and executes `npm publish --dry-run --force`. The dry-run-only
`--force` permits inspecting a version that is already on npm. The actual
publish command retains npm's existing-version checks. A manual run skips the
publish job and creates no tag or registry version.
`release-check.yml` remains available as an additional archive-only check.

## Trusted publisher setup

The one-time configuration is:

```sh
npm trust github @thuraaung2493/nrc-kit --repo thuraaung2493/nrc-kit --file release.yml --env npm --allow-publish --yes
```

npm requires maintainer authentication for this setup. Subsequent tag-triggered
publishes use GitHub OIDC. Do not add registry tokens to GitHub secrets or the
repository. The workflow and environment names must match the npm configuration.
