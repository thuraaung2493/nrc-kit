# NRC Kit

![NRC Kit package banner](https://raw.githubusercontent.com/thuraaung2493/nrc-kit/main/assets/branding/nrc-kit-social-preview.png)

By [Thura Aung](https://github.com/thuraaung2493).

Parse, convert and validate Myanmar NRC numbers in English and Myanmar.
Works offline, with optional React and Zod support.

## Install

```sh
npm install @thuraaung2493/nrc-kit
```

Supports Node.js 22+ and browsers with ES2020 support. React 18.2/19 and Zod 4
are optional; install them only if you use those integrations. Browser behavior
has been tested in Chrome.

## Basic usage

```ts
import { parse, toEnglish, toMyanmar, isValid } from '@thuraaung2493/nrc-kit';

toEnglish('၁၂/လမန(နိုင်)၀၀၁၂၃၄'); // '12/LaMaNa(N)001234'
toMyanmar('12/LaMaNa(N)001234'); // '၁၂/လမန(နိုင်)၀၀၁၂၃၄'
isValid('12/LaMaNa(N)001234'); // true
isValid('12/LaMaNa(N)12345'); // false

parse('12/LaMaNa(N)001234');
// {
//   state: '12',
//   stateName: 'Yangon',
//   township: 'LaMaNa',
//   type: 'N',
//   typeName: 'Full Citizen (Naing-ngan-tha)',
//   number: '001234',
//   language: 'en'
// }

parse('12/LaMaNa(N)001234', 'mm');
// {
//   state: '၁၂',
//   stateName: 'ရန်ကုန်တိုင်း',
//   township: 'လမန',
//   type: 'နိုင်',
//   typeName: 'နိုင်ငံသား',
//   number: '၀၀၁၂၃၄',
//   language: 'mm'
// }
```

`parse()` returns `null` for invalid input. Its default `auto` language follows
the input's township script; `en` or `mm` selects the returned language. The
returned `language`, `stateName` and `typeName` describe that output. Keep serial
numbers as strings to preserve leading zeroes.

Supported types are `N`/`နိုင်` (Full Citizen), `E`/`ဧည့်` (Associate Citizen),
`P`/`ပြု` (Naturalized Citizen) and `M`/`သ` (Monk). `AE` is an alias of `E`.
Nun is not supported. A valid NRC also needs a known state/township pair and
exactly six digits. Validation does not verify identity or document issuance.

Other helpers:

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

## React selector

```tsx
'use client';

import { useState } from 'react';
import { NrcSelector } from '@thuraaung2493/nrc-kit/react';
import '@thuraaung2493/nrc-kit/selector.css'; // optional styling

export function IdentityField() {
  const [value, setValue] = useState('');

  return (
    <NrcSelector
      name="nrc"
      value={value}
      onChange={setValue}
      language="mm"
      required
    />
  );
}
```

Use `defaultValue` instead of `value` for an uncontrolled field. `language`
accepts `en`, `mm` or `auto` (default). Changing language preserves selections.
Incomplete edits emit `''`; a complete value includes all four fields.

The selector submits one complete NRC under `name` (default `nrc`). It also
supports `disabled`, `error`, `onBlur`, `id`, `className` and a forwarded ref.
For React Hook Form, pass the `Controller` field props to the selector.

## Zod validation

```sh
npm install zod@^4
```

```ts
import { z } from 'zod';
import { nrcSchema } from '@thuraaung2493/nrc-kit/zod';

const schema = z.object({
  nrc: nrcSchema({ message: 'Please enter a valid NRC' }),
});

schema.safeParse({ nrc: '12/LaMaNa(N)001234' });
```

The schema validates without changing the input string.

## Add custom data

Create an instance with your verified bilingual records:

```ts
import { createNrc } from '@thuraaung2493/nrc-kit';

export const nrc = createNrc({
  additionalData: [
    {
      state: '12',
      townships: [{ en: 'LaMaNa', mm: 'လမန' }],
    },
  ],
});

nrc.toMyanmar('12/LaMaNa(N)001234');
nrc.isValid('12/LaMaNa(N)001234');
```

The example pair already exists; replace it with your verified missing codes.
States are positive English digit strings without leading zeroes and must fit
a safe integer. Each township
needs an English letter code (`en`) and a Myanmar code (`mm`), without spaces
or separators. You can add townships to existing states or add new state groups.

Existing mappings stay unchanged, duplicates are ignored and conflicts throw
an error. Custom data does not add NRC types or aliases. Each instance is
independent; the regular exports keep the bundled data. Create a new instance
when your configuration changes.

Pass the same instance to React or Zod:

```tsx
<NrcSelector nrc={nrc} name="nrc" language="mm" />
```

```ts
nrcSchema({ nrc });
```

Create the instance outside your component, or memoize it. Changing the selector's
instance resets it from its current `value` or original `defaultValue`. Use the
same data for server rendering and browser hydration.

See [data notes](data/README.md) for the bundled dataset's source and limitations.
