# Shared behavioral contract

This document is a maintainer reference. It describes both packages' default
behavior; their storage and application-configuration mechanisms are independent.

## Input and conversion

The grammar is `state/township(type)serial`, with Unicode whitespace at the
edges and around separators, never inside a component. Allowed whitespace is
U+0009–000D, U+0020, U+00A0, U+1680, U+2000–200A, U+2028–2029, U+202F,
U+205F and U+3000. BOM and NEL are rejected. Input is bounded to 256 characters.

State and serial may mix English/Myanmar digits. State normalizes to a canonical
positive English digit string without leading zeroes and must exist in the
active reference. Township must match a complete English code case-insensitively
or its exact Myanmar code in that state. No fuzzy township matching is performed.
Serial normalizes to exactly six digits and remains a string, including zeroes.

Default types and names:

| English | Myanmar | English name                               | Myanmar name |
| ------- | ------- | ------------------------------------------ | ------------ |
| N       | နိုင်      | Full Citizen (Naing-ngan-tha)              | နိုင်ငံသား       |
| E       | ဧည့်      | Associate Citizen (Aye-naing-ngan-tha)     | ဧည့်နိုင်ငံသား     |
| P       | ပြု      | Naturalized Citizen (Pyu-su-khwint-ya-thu) | နိုင်ငံသားပြုခွင့်ရသူ |
| M       | သ       | Monk (Tharthana-win)                       | သာသနာဝင်      |

English codes are case-insensitive. Existing aliases `Naing` -> `N` and `Pyu` ->
`P` are retained; `AE` -> `E` is added. Both `ဧည့်` and the combining-mark order
`ဧည့်` are accepted and emit `ဧည့်`. Nun/`သီ` and other unlisted types are not
supported by the default catalog. `N` always means Full Citizen, never Nun.
These English letters are package conventions, not a claim of universal official
transliteration.

## Parsing and language

Core languages are `en`, `mm` and alias `eng`; `parse` also accepts default `auto`.
Auto uses the township script to choose the output language. Explicit languages
localize every component and both names. The returned `language` always identifies
that output; it no longer reports the original input language when output is
explicitly selected.

Parsed shape:

```ts
interface ParsedNrc {
  state: string;
  stateName: string;
  township: string;
  type: string;
  typeName: string;
  number: string;
  language: 'en' | 'mm';
}
```

PHP returns the equivalent associative array. English names use the published
region names and type descriptions. Myanmar names include state/region suffixes,
for example `ရန်ကုန်တိုင်း`, and full type descriptions, for example `နိုင်ငံသား`.
Invalid input returns `null`; converters reject invalid values rather than
returning partial or fabricated results.

## Lookup APIs

- `getStates(language='en')` / `Nrc::states()` returns `{ stateNo: number, name }`
  records in reference order. Defaults have 15 region records for 14 NRC state
  numbers: Naypyidaw and Mandalay both have `stateNo: 9`.
- Known state-9 township classifications select `stateName` during parsing.
  Unclassified application codes under 9 use the combined region names. New
  application state numbers without names use localized digits as the name.
- `getTownships(state)` / `Nrc::townships(state)` returns `{ en, mm }` pairs.
  Passing `en`, `eng` or `mm` returns an array of code strings in that language.
- `getTypes(language='en')` / `Nrc::types()` returns `{ en, mm, label }`, with
  `label` localized to the requested language.
- `getTownshipOptions` and `Nrc::townshipOptions` are removed.
- Lookups return fresh arrays/records; unknown township states return `[]`.
  State lookups accept an integer or English/Myanmar digit string. Configured
  states must be positive safe integers (maximum 9007199254740991), stored as
  canonical strings in the township data, so numeric `stateNo` never loses bits.

## Validation and errors

`validate(unknown)` returns `{ valid, errors: [{ code, message }] }`; validation
never coerces non-string NRC input. Error order is deterministic:

1. `INVALID_INPUT_TYPE` for non-strings, with no other errors.
2. `INVALID_FORMAT` for syntax/length failures, with no membership errors.
3. `INVALID_STATE`, otherwise `INVALID_TOWNSHIP` for membership failures.
4. `INVALID_TYPE` for unsupported types.
5. `INVALID_SERIAL_LENGTH` when the serial does not contain six digits.

Unsupported languages throw even for invalid input. JS uses `RangeError` for
invalid options/NRCs and `TypeError` for non-string conversions/parts. PHP uses
`InvalidArgumentException` for invalid options/NRCs and `TypeError` for conversion
or parts type errors. Building from parts requires four strings and forbids NRC
separators inside individual parts. Descriptive names on parsed objects are not
used as input components. Number conversion validates both language arguments,
normalizes digit scripts and leaves other characters unchanged.

## Selectors

Selectors keep canonical English string values internally and localize labels,
region names, township/type codes and serial digits. Their state control has one
option for state number 9 labeled with both region names. Language switching
preserves canonical selections and leading zeroes. Invalid/partial edits emit
and submit an empty value, and invalid presets never become another valid NRC.

Exactly four visible native controls are labeled and have no individual form
names. One hidden field submits the complete NRC. Required/disabled semantics,
form reset, multiple instances, escaped errors and keyboard access are tested.
React supports controlled and uncontrolled operation, stable configured instances
and SSR hydration; Blade requires the distributed browser asset. Both adapters
use their own package core/reference; neither imports the sibling repository.

## Data and verification

The TypeScript package keeps `data/nrc.json` and `data/nrc-metadata.json`. Laravel
stores the equivalent data, states and types directly in `config/nrc-kit.php`.
Default township values/order are unchanged. Shared fixtures are byte-identical;
optional maintainer checks compare decoded data and metadata plus all public
results. Normal builds/tests work independently, offline at runtime.

Validation checks format/reference membership, never identity or document
issuance. Both packages are unreleased; these shape and language changes are
intentional breaking changes and are recorded in each changelog.
