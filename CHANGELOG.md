# Changelog

## Unreleased

- Breaking: added E/AE (Associate Citizen) and M (Monk); N remains Full Citizen
  and Nun is unsupported. Added localized region/type names to parsing; returned
  `language` now describes the output language.
- Breaking: states return `stateNo`/`name`, types return `en`/`mm`/localized `label`,
  and townships return bilingual pairs by default or strings for a language.
  Removed the separate township-options API. State 9 lists both regions and has
  one combined selector option. Numeric state IDs must be safe integers.

- Added isolated `createNrc({ additionalData })` instances, append-only bilingual
  data validation, and shared-instance support for React selectors and Zod.
- Initial offline bilingual NRC engine and bundled, checksummed reference snapshot.
- Localized native selector, strict validation and independent package tests.

- Added enforced formatting and static-analysis tooling with independent CI checks.
