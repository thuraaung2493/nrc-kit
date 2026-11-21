# API reference

Core exports are available from `@thuraaung2493/nrc-kit`.

| Helper                   | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `parse(input, language)` | Parse an NRC, or return `null` if invalid    |
| `toEnglish(input)`       | Validate and convert an NRC to English       |
| `toMyanmar(input)`       | Validate and convert an NRC to Myanmar       |
| `isValid(input)`         | Check whether an NRC is valid                |
| `createNrc(config)`      | Create an isolated instance with custom data |

| Helper                              | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `convert(input, 'mm')`              | Convert to the selected language                                     |
| `validate(input)`                   | Return `{ valid, errors: [{ code, message }] }`                      |
| `formatNrc(parts, 'mm')`            | Build an NRC from string `state`, `township`, `type`, `number` parts |
| `convertNumbers(input, 'mm', 'en')` | Convert digits only                                                  |
| `getStates('mm')`                   | Named regions: `{ stateNo, name }`                                   |
| `getTownships(12, 'mm')`            | Myanmar township code strings                                        |
| `getTownships(12)`                  | Bilingual township pairs: `{ en, mm }`                               |
| `getTypes('mm')`                    | Bilingual codes and localized descriptions: `{ en, mm, label }`      |

`getTypes()` returns `{ en, mm, label }` records, with `label` in the requested
language. State number 9 has separate Naypyidaw and Mandalay records. Parsing
uses known township codes to choose the name; selectors combine both names into
one state-number option.

Conversion and formatting throw on invalid input. Use `isValid()` or
`validate()` when handling user input.

See the [quick start](quick-start.md), [React selector](guides/react-selector.md), [Zod validation](guides/zod-validation.md), and [custom data](guides/custom-data.md). For detailed behavior and errors, see the [shared behavioral contract](../CONTRACT.md).
