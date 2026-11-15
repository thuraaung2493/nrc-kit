// Optional maintainer check. This script is never called by build, check or CI.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import * as nrc from '../dist/index.js';

const phpRoot = resolve(process.argv[2] || '../laravel-nrc-kit');

for (const path of ['tests/fixtures/nrc-cases.json', 'CONTRACT.md'])
  assert.equal(
    readFileSync(path, 'utf8'),
    readFileSync(join(phpRoot, path), 'utf8'),
    path + ' differs',
  );

const data = JSON.parse(readFileSync('data/nrc.json', 'utf8'));
const phpData = JSON.parse(
  execFileSync(
    process.env.PHP_BINARY || 'php',
    [join(phpRoot, 'scripts/parity.php'), '--data'],
    { encoding: 'utf8' },
  ),
);

assert.deepEqual(
  data,
  phpData,
  'TypeScript JSON and Laravel PHP configuration data differ',
);

const metadata = JSON.parse(readFileSync('data/nrc-metadata.json', 'utf8'));
const phpMetadata = JSON.parse(
  execFileSync(
    process.env.PHP_BINARY || 'php',
    [join(phpRoot, 'scripts/parity.php'), '--metadata'],
    { encoding: 'utf8' },
  ),
);
assert.deepEqual(
  metadata,
  phpMetadata,
  'Named states and type metadata differ',
);

const fixtures = JSON.parse(
  readFileSync('tests/fixtures/nrc-cases.json', 'utf8'),
);
const inputs = fixtures.map((f) => f.input);

for (const group of data)
  for (const township of group.townships)
    for (const type of ['N', 'P', 'Naing', 'Pyu', 'E', 'AE', 'M']) {
      inputs.push(`${group.state}/${township.en}(${type})001234`);
      inputs.push(`${group.state}/${township.mm}(${type})၀0၁234`);
    }

function resultFor(api, values) {
  return {
    cases: values.map((input) => ({
      validation: api.validate(input),
      auto: api.parse(input),
      en: api.parse(input, 'en'),
      mm: api.parse(input, 'mm'),
      english: api.isValid(input) ? api.toEnglish(input) : null,
      myanmar: api.isValid(input) ? api.toMyanmar(input) : null,
    })),
    states: { en: api.getStates('en'), mm: api.getStates('mm') },
    types: api.getTypes('mm'),
    options: Array.from({ length: 15 }, (_, i) => ({
      en: api.getTownships(i + 1),
      mm: api.getTownships(i + 1, 'mm'),
      pairs: api.getTownships(i + 1),
    })),
  };
}

const result = resultFor(nrc, inputs);
const php = JSON.parse(
  execFileSync(
    process.env.PHP_BINARY || 'php',
    [join(phpRoot, 'scripts/parity.php')],
    {
      input: JSON.stringify(inputs),
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    },
  ),
);

assert.deepEqual(result, php);

console.log(
  `Cross-language parity passed: ${inputs.length} inputs, every township/type, localized parse/convert/validation and lookup output; reference data equal, fixtures and contract byte-identical.`,
);

const additionalData = [
  { state: '12', townships: [{ en: 'TestCode', mm: 'ကခဂ' }] },
  { state: '99', townships: [{ en: 'TestCode', mm: 'ကခဂ' }] },
];
const configured = nrc.createNrc({ additionalData });
const configuredData = [
  ...new Set(configured.getStates().map(({ stateNo }) => String(stateNo))),
].map((state) => ({
  state,
  townships: configured.getTownships(state),
}));
const configuredInputs = [
  '12/TestCode(N)001234',
  '၁၂/ကခဂ(ပြု)၀၀၁၂၃၄',
  '99/testcode(Pyu)၀0၁234',
  '၉၉/ကခဂ(နိုင်)၀၀၁၂၃၄',
  '1/TestCode(N)001234',
  '100/TestCode(N)001234',
  '99/TestCode(X)001234',
  '99/TestCode(N)12345',
  '12/LaMaNa(N)001234',
  '12/TestCode(AE)001234',
  '၉၉/ကခဂ(သ)၀၀၁၂၃၄',
  '12/TestCode(သီ)001234',
  '9/UTaTha(M)001234',
  '9/MaNaMa(E)001234',
];
// Bootstrap only this PHP process; the sibling sources and snapshot stay intact.
const bootstrap = String.raw`
require $argv[1] . '/vendor/autoload.php';
Illuminate\Container\Container::getInstance()->instance('config',
    new Illuminate\Config\Repository(['nrc-kit' => [
        'data' => json_decode($argv[2], true, 512, JSON_THROW_ON_ERROR),
    ]])
);
require $argv[1] . '/scripts/parity.php';
`;
const configuredPhp = JSON.parse(
  execFileSync(
    process.env.PHP_BINARY || 'php',
    ['-r', bootstrap, phpRoot, JSON.stringify(configuredData)],
    {
      input: JSON.stringify(configuredInputs),
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    },
  ),
);

assert.deepEqual(resultFor(configured, configuredInputs), configuredPhp);
console.log(
  `Configured cross-language parity passed: ${configuredInputs.length} cases and localized lookups.`,
);
