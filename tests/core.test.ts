import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import data from '../data/nrc.json';
import cases from './fixtures/nrc-cases.json';
import * as nrc from '../src';

describe('snapshot and shared contract', () => {
  it('pins provenance and data integrity', () => {
    expect(
      createHash('sha256')
        .update(readFileSync(new URL('../data/nrc.json', import.meta.url)))
        .digest('hex'),
    ).toBe('5230aa59fb37d5d9c5bbb5fc13464ae94a8bfad51af1086353fc8e475ac8cf18');
    expect(data.map((g) => g.state)).toEqual(
      Array.from({ length: 14 }, (_, i) => String(i + 1)),
    );
    expect(data.flatMap((g) => g.townships)).toHaveLength(429);

    for (const group of data)
      for (const language of ['en', 'mm'] as const) {
        const codes = group.townships.map((t) => t[language].toLowerCase());

        expect(new Set(codes).size).toBe(codes.length);
        expect(codes.every(Boolean)).toBe(true);
      }
  });

  for (const test of cases)
    it(JSON.stringify(test.input), () => {
      const valid = !test.errors;

      expect(nrc.isValid(test.input)).toBe(valid);
      expect(nrc.validate(test.input).errors.map((e) => e.code)).toEqual(
        test.errors ?? [],
      );

      if (!valid) {
        expect(nrc.parse(test.input)).toBeNull();

        return;
      }

      expect(nrc.toEnglish(test.input)).toBe(test.en);
      expect(nrc.toMyanmar(test.input)).toBe(test.mm);
      expect(nrc.parse(test.input)?.language).toBe(test.language);
      expect(nrc.parse(test.input)).toEqual(
        nrc.parse(test.input, test.language as 'en' | 'mm'),
      );
      expect(nrc.parse(test.input, 'eng')).toEqual(nrc.parse(test.input, 'en'));
      expect(nrc.formatNrc(nrc.parse(test.input, 'en')!, 'mm')).toBe(test.mm);
    });

  it('round-trips every township, both types, aliases, and mixed digits', () => {
    for (const group of data)
      for (const t of group.townships)
        for (const [alias, canonical] of [
          ['N', 'N'],
          ['Naing', 'N'],
          ['P', 'P'],
          ['Pyu', 'P'],
          ['E', 'E'],
          ['AE', 'E'],
          ['M', 'M'],
        ]) {
          const input = `${group.state}/${t.en.toLowerCase()}(${alias})001234`;
          const canonicalEn = `${group.state}/${t.en}(${canonical})001234`;

          expect(nrc.toEnglish(nrc.toMyanmar(input))).toBe(canonicalEn);

          const mixed = `${nrc.convertNumbers(group.state, 'en', 'mm')}/${t.mm}(${alias})၀0၁234`;

          expect(nrc.toEnglish(mixed)).toBe(canonicalEn);
          expect(nrc.parse(mixed)?.language).toBe('mm');
        }
  });

  it('returns fresh canonical options and rejects unknown states', () => {
    expect(nrc.getStates('mm').find((state) => state.stateNo === 12)).toEqual({
      stateNo: 12,
      name: 'ရန်ကုန်တိုင်း',
    });
    expect(nrc.getTypes('mm').map((type) => type.en)).toEqual([
      'N',
      'E',
      'P',
      'M',
    ]);
    expect(nrc.getTownships('၁၂', 'mm')).toContain('လမန');
    expect(nrc.getTownships(99)).toEqual([]);

    const options = nrc.getTownships(12);
    options[0].mm = 'broken';

    expect(nrc.getTownships(12)[0].mm).not.toBe('broken');

    nrc.getStates()[0].name = 'broken';

    expect(nrc.getStates()[0].name).toBe('Kachin');
  });

  it('rejects bad types, injected parts, language arguments, and unbounded input', () => {
    expect(() => nrc.convert(12 as never)).toThrow(TypeError);
    expect(() => nrc.convert('bad')).toThrow(RangeError);
    expect(() => nrc.parse('bad', 'xx' as never)).toThrow(RangeError);
    expect(() =>
      nrc.formatNrc({
        state: '12',
        township: 'LaMaNa',
        type: 'N',
        number: 123456,
      } as never),
    ).toThrow(TypeError);
    expect(() =>
      nrc.formatNrc({
        state: '12/LaMaNa(N)001234',
        township: 'LaMaNa',
        type: 'N',
        number: '001234',
      }),
    ).toThrow(RangeError);
    expect(nrc.parse(' '.repeat(100000))).toBeNull();
    expect(nrc.isValid('12/LaMaNa(constructor)001234')).toBe(false);
    expect(nrc.convertNumbers('၀0၁၂၃၄', 'mm', 'en')).toBe('001234');
  });
});
