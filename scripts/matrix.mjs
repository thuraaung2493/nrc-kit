import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const temporary = mkdtempSync(join(tmpdir(), 'nrc-react-matrix-'));

try {
  for (const version of ['18.2.0', '19']) {
    const directory = join(temporary, version);
    cpSync(resolve('.'), directory, {
      recursive: true,
      filter: (path) =>
        !['node_modules', '.git', 'dist'].some(
          (name) =>
            path === resolve(name) || path.startsWith(resolve(name) + '/'),
        ),
    });

    const npm = (args) =>
      execFileSync('npm', [...args, '--cache', join(temporary, 'cache')], {
        cwd: directory,
        stdio: 'inherit',
      });
    npm(['ci', '--no-audit', '--no-fund']);
    npm([
      'install',
      '--no-save',
      '--package-lock=false',
      `react@${version}`,
      `react-dom@${version}`,
      `@types/react@${version === '19' ? '19' : '18'}`,
      `@types/react-dom@${version === '19' ? '19' : '18'}`,
      '--no-audit',
      '--no-fund',
    ]);

    npm(['run', 'typecheck']);
    npm(['test']);
    npm(['run', 'build']);

    console.log(`React ${version} compatibility passed`);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
