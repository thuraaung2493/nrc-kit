# Add custom data

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

See [data notes](../../data/README.md) for the bundled dataset's source and limitations.
