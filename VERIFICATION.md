# Verification record — 2026-11-14

Implementation proceeded in phases; relevant checks passed before continuing.

1. **Reference data and contract:** inspected both legacy projects read-only;
   checked 14 state groups, 429 bilingual township pairs, uniqueness and the
   recorded SHA-256. Chose township-script detection for mixed input; documented
   exact grammar, whitespace, aliases, option shapes and error ordering.
2. **Core engines:** initial JS core suite (24 tests) and independent PHP 7.4
   suite (8 tests, 5,326 assertions) passed, including every-township round trips.
   The final JS core suite has 27 tests after Unicode-whitespace regressions.
3. **Laravel adapter:** native validation rule, Blade rendering/session/escaping
   and shipped browser-controller checks passed independently in its repository.
4. **React/Zod adapters:** initial 54 JS tests, type checks and builds passed.
   Final regression suite: **61 tests passed** (27 core, 31 React, 3 Zod).
   The complete final suite, type check and build passed in isolated copies with
   **React 18.2.0 and React 19**, including RHF Controller and SSR/hydration.
5. **Artifact/consumer verification:** `npm run check` passed: TypeScript, all
   tests, ESM/CJS/declaration build, three clean tarball consumers, optional peer
   isolation, and `npm pack --dry-run`. `/react` declarations also resolved in a
   clean React 19 consumer. The full suite ran on **Node 22.23.5**; type checks
   and build also ran on that baseline. Local host Node was 25.6.1.

Playwright exercised Chrome/Chromium **157.0.8103.52**: localized native form
submission, leading zeroes, dependent choices, mixed serial digits, partial
validity, keyboard focus, disabled submission, controlled reset and SSR hydration.
The optional local cross-language comparison passed **3,455 inputs**, matching
all parsed locales, conversions, structured validation and options, as well as
identical snapshot, fixture and contract bytes. Standard CI never invokes that
optional sibling comparison.

`npm audit --omit=dev` reported **zero production vulnerabilities**. Core has no
runtime dependencies. No requests, document globals or UI-library imports occur
in the root entry. React/Zod peers remain separate and optional.

Independent CI is configured for Node 22/24 and React 18.2/19; remote CI has not
run because source has not been pushed. Only Chromium is verified; other browser
engines and older browsers are not claimed. The historical community dataset
has not been certified against a current government registry; unknown codes are
rejected. See data/README.md for provenance and correction procedure.

The two Git repositories are independent. The parent is unchanged and has no
Git/package/workspace configuration. GitHub origins are private, empty
repositories; no source commits, pushes, tags, registry publications or releases
were made. Release workflows only produce manual review artifacts.

## Code quality follow-up

ESLint 10 with type-aware typescript-eslint and React Hooks rules, Prettier 3
and EditorConfig are configured. The full source/tests/scripts/configuration
set is formatted; reference snapshot and mirrored fixture/contract bytes are
excluded from rewriting. `format:check`, lint (zero warnings), strict TypeScript,
all 61 tests and the package build passed after formatting/type fixes. The
aggregate check and CI now enforce formatting and linting before the existing
checks. Tooling requires Node 22.13+; consumer runtime requirements and optional
peer boundaries remain unchanged.

## Configured reference data — 2026-11-15

`createNrc({ additionalData })` creates an isolated copy of the bundled reference
with validated, append-only bilingual application records. Existing named
exports retain their default behavior. React's `nrc` prop and Zod's `nrc` option
share the instance. No runtime dependencies or global setter were added; the
snapshot, shared fixtures and contract bytes remain unchanged.

Phase verification:

- Core: 57 passing tests, including 30 configuration tests for strict shapes,
  scripts and lengths, conflicts, duplicates, numeric state ordering, input and
  output mutation isolation, and independent instances.
- Adapters: all 95 tests passed, including configured React presets, controlled
  values, language/state changes, reset, SSR hydration, and Zod validation.
- `npm run check` passed: Prettier, ESLint with zero warnings, strict TypeScript,
  all 95 tests, ESM/CommonJS/declaration builds, three clean packed consumers and
  `npm pack --dry-run`. Consumers exercise the factory in both module formats
  and type-check the exported configuration and adapter options. Optional peers
  remain isolated.
- `npm run test:matrix` passed all 95 tests, type checking and builds separately
  with React 18.2.0 and React 19.
- `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` passed on Chromium
  157.0.8103.52, including configured native form submission, localized custom
  records, explicit new states, reset and invalid state/township combinations.
- Optional local parity against Laravel/PHP 7.4 passed 3,455 default inputs and
  nine configured inputs with localized lookup comparisons. The script remains
  outside normal build, tests and CI.

README examples document the shared record shape, trusted configuration,
creation-time errors, stable instances, and identical SSR/browser data. Laravel
documentation now points to the TypeScript factory. No version bumps, pushes,
tags, package publications or releases were made.

## Named references, new types and localized parsing — 2026-11-15

The public APIs now return named states (`stateNo`, `name`), bilingual type
records (`en`, `mm`, localized `label`), and township pairs by default or code
strings for an explicit language. The separate township-options API is removed.
Parsing adds `stateName` and `typeName`; its `language` identifies the returned
language. Auto detection still follows the input township script. Both exact
English/Myanmar examples requested by the user were verified in the installed
playground consumer.

The default catalog supports N (Full Citizen), E (Associate Citizen; alias AE),
P (Naturalized Citizen) and M (Monk). Nun is unsupported. Metadata lives in
`data/nrc-metadata.json`; the 429 original township pairs and their checksum are
unchanged. State number 9 has two named records, with known township
classifications for parsed names and one combined selector option. Unknown
application names fall back to localized digits/combined state-9 names.
Numeric state IDs require safe integers, preventing precision loss.

Verification passed:

- `npm run check`: Prettier, ESLint (zero warnings), strict TypeScript, all 119
  tests, ESM/CommonJS/declaration builds, three clean package consumers and
  `npm pack --dry-run`. Consumer checks cover new export shapes, removed APIs,
  E/M conversion and localized parsed metadata in both module formats.
- `npm run test:matrix`: all 119 tests, type checks and builds on React 18.2.0
  and React 19 independently.
- Real Chrome 157.0.8103.52: E/M submission, leading zeroes, localized names,
  one state-9 option, controlled/uncontrolled flows, config data and SSR hydration.
- Optional PHP 7.4 parity: 6,036 default inputs and 14 configured cases, including
  every township with all supported type aliases, all parsed locales, lookup
  shapes, named states and localized type descriptions. Data and metadata match
  Laravel's PHP config; contract and behavioral fixtures are byte-identical.
- Refreshed `/Users/blackmonster/dev/playground/nrc-package-test` from the built
  local package. npm retained its same-version copy initially; replacing only
  that dependency fixed it. Exact output objects, AE/M conversion and removed
  exports passed, and `npm ls --depth=0` reported a valid installation.

No dependencies, runtime baselines, package versions, publications, pushes,
tags or releases changed. Remote CI has not run. README and changelog record
these intentional breaking shape/language changes.
