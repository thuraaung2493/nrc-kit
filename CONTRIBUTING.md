# Contributing

These instructions are for developing the package, not using it in an app.

## Compatibility and development

Node.js 22+; ESM and CommonJS exports with separate `.d.ts`/`.d.cts` declarations.
Browser output targets ES2020 and native form controls; Chromium 157 is the
verified browser baseline, exercised by Playwright. React 18.2/19 and Zod 4 are tested independently. Other browser engines
are not claimed as verified. No runtime requests are made.

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser
```

`npm run test:consumers` packs locally and installs three isolated temporary
consumers (core only, React only, Zod only), checks JS/declarations and optional
peer isolation. It accesses npm to install test peers; runtime is offline.
Set `REACT_VERSION=19` to select the consumer React major. `npm run test:matrix`
executes the full test suite in independent React 18.2 and 19 copies.
Use `PLAYWRIGHT_CHANNEL=chrome` to exercise an installed Chrome instead of the
downloaded Chromium. Tests and CI never require the PHP sibling repository. For an optional local
maintainer parity check with both checkouts available, build first and run
`PHP_BINARY=php node scripts/parity.mjs /path/to/laravel-nrc-kit`.

[RELEASING.md](RELEASING.md) describes tag-triggered CD and its publishing-free dry run.

Actual phase results and compatibility limits: [VERIFICATION.md](VERIFICATION.md).

## Code quality tools

Use Node 22.13+ for development tooling (ESLint 10); the published package's
Node 22 runtime baseline is unchanged. Install the locked development tools
with `npm ci`.

```sh
npm run format        # Prettier: apply formatting
npm run format:check  # Prettier: check without writing
npm run lint          # ESLint, with zero warnings allowed
npm run lint:fix      # apply safe ESLint fixes
npm run typecheck     # strict TypeScript, no emitted files
npm run check         # quality checks, tests, build and clean consumers
```

ESLint uses type-aware typescript-eslint rules plus React Rules of Hooks and
exhaustive dependency checks. Prettier owns layout; eslint-config-prettier avoids
conflicting style rules. Source, tests, scripts and configuration are checked.
Prettier uses two-space indentation, single quotes, semicolons, LF endings and
an 80-column preference, matching EditorConfig. Generated builds, dependencies
and lockfiles are excluded. The checksummed reference dataset and synchronized
fixtures/contract keep their original bytes. CI enforces these commands through
`npm run check`. Enable format-on-save using the project config if desired.

## Implementation rules

[CONTRACT.md](CONTRACT.md) records the detailed parsing, validation and selector
rules shared by the Laravel and TypeScript implementations. Maintainers use it
with the shared fixtures to prevent differences between the packages. Package
users do not need to read it to get started.
