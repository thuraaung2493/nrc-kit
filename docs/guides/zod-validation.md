# Zod validation

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
