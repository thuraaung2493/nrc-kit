# React selector

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
