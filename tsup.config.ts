import { defineConfig } from 'tsup';

const common = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  target: 'es2020',
  dts: true,
  splitting: false,
  sourcemap: true,
  external: ['react', 'react/jsx-runtime', 'zod'],
};

export default defineConfig([
  {
    ...common,
    entry: { index: 'src/index.ts', 'zod/index': 'src/zod/index.ts' },
  },
  {
    ...common,
    entry: { 'react/index': 'src/react/index.ts' },
    banner: { js: '"use client";' },
  },
]);
