import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('.');
const temporary = mkdtempSync(join(tmpdir(), 'nrc-consumers-'));
const run = (exe, args, cwd = temporary) =>
  execFileSync(exe, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const npm = (args, cwd) =>
  run(
    'npm',
    [...args, '--cache', join(temporary, 'cache'), '--no-audit', '--no-fund'],
    cwd,
  );

try {
  const [packed] = JSON.parse(
    run('npm', ['pack', '--json', '--pack-destination', temporary], root),
  );
  const paths = packed.files.map((f) => f.path);

  for (const entry of ['index', 'react/index', 'zod/index'])
    for (const extension of ['js', 'cjs', 'd.ts', 'd.cts'])
      assert(
        paths.includes(`dist/${entry}.${extension}`),
        `Missing ${entry}.${extension}`,
      );

  assert(paths.includes('data/nrc.json'));
  assert(paths.includes('data/nrc-metadata.json'));
  assert(paths.includes('src/react/selector.css'));
  assert(
    paths.every(
      (p) =>
        !p.includes('node_modules') &&
        !p.startsWith('tests/') &&
        !p.includes('SPEC.md'),
    ),
  );

  const tgz = join(temporary, packed.filename);

  for (const kind of ['core', 'react', 'zod']) {
    const directory = join(temporary, kind);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(directory);
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({
        name: `nrc-${kind}-consumer`,
        version: '1.0.0',
        private: true,
        type: 'module',
      }),
    );

    const peers =
      kind === 'react'
        ? [
            `react@${process.env.REACT_VERSION || '18'}`,
            `@types/react@${process.env.REACT_VERSION || '18'}`,
          ]
        : kind === 'zod'
          ? ['zod@4']
          : [];
    npm(['install', '--ignore-scripts', tgz, ...peers], directory);

    if (kind !== 'react')
      assert(!existsSync(join(directory, 'node_modules/react')));

    if (kind !== 'zod')
      assert(!existsSync(join(directory, 'node_modules/zod')));

    const specifier = `@thuraaung2493/nrc-kit${kind === 'core' ? '' : '/' + kind}`;
    const check =
      kind === 'core'
        ? `assert.equal(api.toEnglish('၁၂/လမန(နိုင်)၀၀၁၂၃၄'),'12/LaMaNa(N)001234');`
        : kind === 'react'
          ? 'assert.ok(api.NrcSelector);'
          : `assert.equal(api.nrcSchema().parse('12/LaMaNa(N)001234'),'12/LaMaNa(N)001234');`;
    const configuredCheck = `const nrc = core.createNrc({additionalData:[{state:'99',townships:[{en:'TestCode',mm:'ကခဂ'}]}]}); assert.equal(nrc.toEnglish('၉၉/ကခဂ(နိုင်)၀၀၁၂၃၄'),'99/TestCode(N)001234'); assert.equal(core.isValid('99/TestCode(N)001234'),false); ${kind === 'zod' ? "assert.equal(api.nrcSchema({nrc}).parse('99/TestCode(N)001234'),'99/TestCode(N)001234');" : ''}`;
    const apiCheck = `assert.equal(core.parse('12/LaMaNa(N)001234','mm').language,'mm'); assert.equal(core.parse('12/LaMaNa(N)001234','mm').typeName,'နိုင်ငံသား'); assert.equal(core.parse('12/LaMaNa(N)001234','mm').stateName,'ရန်ကုန်တိုင်း'); assert.equal(core.toEnglish('၁၂/လမန(ဧည့်)၀၀၁၂၃၄'),'12/LaMaNa(E)001234'); assert.equal(core.toMyanmar('12/LaMaNa(M)001234'),'၁၂/လမန(သ)၀၀၁၂၃၄'); assert.deepEqual(core.getTownships(10)[0],{en:'MaLaMa',mm:'မလမ'}); assert.equal(core.getStates('en')[0].name,'Kachin'); assert.equal('getTownshipOptions' in core,false);`;
    writeFileSync(
      join(directory, 'smoke.mjs'),
      `import assert from 'node:assert/strict'; import * as api from '${specifier}'; import * as core from '@thuraaung2493/nrc-kit'; ${check} ${configuredCheck} ${apiCheck}`,
    );
    writeFileSync(
      join(directory, 'smoke.cjs'),
      `const assert=require('node:assert/strict'); const api=require('${specifier}'); const core=require('@thuraaung2493/nrc-kit'); ${check} ${configuredCheck} ${apiCheck}`,
    );
    run(process.execPath, ['smoke.mjs'], directory);
    run(process.execPath, ['smoke.cjs'], directory);

    const source =
      kind === 'core'
        ? `import {parse,createNrc,getStates,getTownships,getTypes,type StateInfo,type NrcType,type NrcConfig,type StateGroup,type Township,type NrcKit} from '${specifier}'; const pair: Township = {en:'TestCode',mm:'ကခဂ'}; const group: StateGroup = {state:'99',townships:[pair]}; const config: NrcConfig = {additionalData:[group]}; const nrc: NrcKit = createNrc(config); const result: string | undefined = nrc.parse('bad')?.typeName; const states: StateInfo[] = getStates('en'); const types: NrcType[] = getTypes('mm'); const pairs: Township[] = getTownships(10); const codes: string[] = getTownships(12,'en'); parse; states; types; pairs; codes;`
        : kind === 'react'
          ? `import {createNrc} from '@thuraaung2493/nrc-kit'; import {NrcSelector, type NrcSelectorProps} from '${specifier}'; const props: NrcSelectorProps = {value:'',language:'mm',nrc:createNrc()}; NrcSelector; props;`
          : `import {createNrc} from '@thuraaung2493/nrc-kit'; import {nrcSchema} from '${specifier}'; const result: string = nrcSchema({nrc:createNrc()}).parse('12/LaMaNa(N)001234');`;

    for (const ext of ['mts', 'cts'])
      writeFileSync(join(directory, `types.${ext}`), source);

    run(
      process.execPath,
      [
        join(root, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'ES2020',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        'types.mts',
        'types.cts',
      ],
      directory,
    );

    if (kind === 'core') {
      const failed = run(
        process.execPath,
        [
          '-e',
          `for(const path of ['react','zod']) {try {require('@thuraaung2493/nrc-kit/'+path);process.exit(1)} catch(e) {if(e.code!=='MODULE_NOT_FOUND') throw e;}}`,
        ],
        directory,
      );

      assert.equal(failed, '');
    }

    console.log(
      `${kind}: clean install, ESM, CommonJS and TypeScript exports passed`,
    );
  }

  const core = readFileSync(join(root, 'dist/index.js'), 'utf8');
  assert(!/from ["'](?:react|zod)|require\(["'](?:react|zod)/.test(core));
  assert(
    !readFileSync(join(root, 'dist/react/index.js'), 'utf8').includes(
      'from "zod"',
    ),
  );
  console.log('Package contents and optional peer isolation passed');
} catch (error) {
  if (error.stdout) console.error(String(error.stdout));

  if (error.stderr) console.error(String(error.stderr));

  throw error;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
