# Reference data

Snapshot of `thuraaung2493/mm-nrc-converter`, revision
`28312a9e97e8d37a4205ea05fe05cf63635cf3ba`, `data/nrc.json`.
Verified against that local source on 2026-11-14: 14 state numbers, 429 township
pairs, no duplicate English (case-insensitive) or Myanmar codes within a state.
SHA-256: `5230aa59fb37d5d9c5bbb5fc13464ae94a8bfad51af1086353fc8e475ac8cf18`.

This is a historical community reference, not an official or exhaustive registry
of issued documents. The township codes and their order are retained from that source.
State 9 combines Mandalay and Naypyidaw entries.

The canonical maintained snapshot is `thuraaung2493/nrc-kit/data/nrc.json`.
Corrections require cited reference evidence and maintainer review. Apply an
approved correction there, copy the equivalent records into Laravel's
`config/nrc-kit.php` and the behavioral fixtures into
`thuraaung2493/laravel-nrc-kit`, update both fingerprints and provenance, and run
each repository independently. Separate commits/PRs and releases apply.
Neither installation, build, tests nor runtime depends on a sibling checkout.

The inherited dataset is from an ISC-licensed package; attribution is retained
in LICENSE. Validation checks format and reference membership only, never a
person's identity or whether a document was issued.

Applications can extend a local instance with `createNrc({ additionalData })`.
These append-only mappings do not modify the bundled snapshot or its checksum.
Laravel stores its full dataset in `config/nrc-kit.php` under `data`, where
applications can edit, add or remove records. Its published configuration is a
full replacement, while TypeScript instances keep their append-only extension
API. Neither package copies application configuration automatically. See the
package README for validation and conflict rules. Shared fixtures describe the
default bundled reference.

## Named regions and NRC types

`data/nrc-metadata.json` contains the requested bilingual region names and the
N/E/P/M type catalog. English letters are package conventions: E accepts alias
AE, P remains Naturalized Citizen, and N means Full Citizen. Nun is omitted.
English type descriptions use `label`; Myanmar descriptions use `labelMm`.
The public `getTypes(language)` returns only `en`, `mm` and the localized `label`.

Fifteen named regions share fourteen NRC state numbers. The two state-9 records
classify the existing township codes into Naypyidaw and Mandalay. Unclassified
application codes under 9 receive the combined name, and application state
numbers without metadata receive localized digit names. Selectors combine the
two region names into one option so state number 9 is not an ambiguous value.

The administrative distinction is consistent with the
[Naypyitaw Council reference](https://myanmar.gov.mm/naypyitaw-council).
These labels and type conventions implement the approved package API; they do
not certify an identity, document issuance or a universal English code standard.
Keep this metadata synchronized with Laravel's `states` and `types` configuration
when correcting names/classifications. The optional parity check compares all
records, descriptions and parsed output names across both storage formats.
