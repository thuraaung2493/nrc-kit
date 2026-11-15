import { rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });

execFileSync(process.execPath, ['node_modules/tsup/dist/cli-default.js'], {
  stdio: 'inherit',
});
