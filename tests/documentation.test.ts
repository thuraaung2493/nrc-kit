import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps the installation page command in sync with the overview', () => {
  const pattern =
    /<!-- installation-command:start -->\s*```[^\n]*\n([\s\S]*?)```\s*<!-- installation-command:end -->/;
  const overview = readFileSync('README.md', 'utf8').match(pattern)?.[1].trim();
  const installation = readFileSync('docs/installation.md', 'utf8')
    .match(pattern)?.[1]
    .trim();

  expect(overview).toBeTruthy();
  expect(installation).toBe(overview);
});
