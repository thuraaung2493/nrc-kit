import { describe, expect, it } from 'vitest';
import * as defaults from '../src';
import { createNrc } from '../src';
import { additionalData, customNrc } from './additional-data';

describe('application reference data', () => {
  it('shares one reference across parsing, validation, conversion and lookups', () => {
    const english = '12/TestCode(P)001234';
    const myanmar = '၁၂/ကခဂ(ပြု)၀၀၁၂၃၄';

    expect(customNrc.toMyanmar(english)).toBe(myanmar);
    expect(customNrc.toEnglish(myanmar)).toBe(english);
    expect(customNrc.convert(english, 'mm')).toBe(myanmar);
    expect(customNrc.parse(myanmar, 'en')).toEqual({
      state: '12',
      stateName: 'Yangon',
      township: 'TestCode',
      type: 'P',
      typeName: 'Naturalized Citizen (Pyu-su-khwint-ya-thu)',
      number: '001234',
      language: 'en',
    });
    expect(customNrc.parse(english, 'mm')?.township).toBe('ကခဂ');
    expect(customNrc.parse(myanmar)?.language).toBe('mm');
    expect(customNrc.toEnglish(' ၁၂/testcode(Pyu)၀0၁234 ')).toBe(english);
    expect(customNrc.formatNrc(customNrc.parse(english)!, 'mm')).toBe(myanmar);
    expect(customNrc.validate(english)).toEqual({ valid: true, errors: [] });
    expect(customNrc.isValid(english)).toBe(true);
    expect(customNrc.getTownships('၁၂', 'mm').at(-1)).toBe('ကခဂ');
    expect(customNrc.getTownships(12).at(-1)).toEqual({
      en: 'TestCode',
      mm: 'ကခဂ',
    });
    expect(customNrc.getTownships(12).slice(0, -1)).toEqual(
      defaults.getTownships(12),
    );
    expect(customNrc.getTypes()).toEqual(defaults.getTypes());
    expect(customNrc.convertNumbers('001234', 'en', 'mm')).toBe('၀၀၁၂၃၄');
  });

  it('enforces state membership, types, six digits and length with custom data', () => {
    for (const [input, code] of [
      ['1/TestCode(N)001234', 'INVALID_TOWNSHIP'],
      ['100/TestCode(N)001234', 'INVALID_STATE'],
      ['12/TestCode(X)001234', 'INVALID_TYPE'],
      ['12/TestCode(N)12345', 'INVALID_SERIAL_LENGTH'],
      [' '.repeat(257), 'INVALID_FORMAT'],
    ]) {
      expect(customNrc.validate(input).errors[0].code).toBe(code);
      expect(customNrc.parse(input)).toBeNull();
      expect(() => customNrc.toEnglish(input)).toThrow(RangeError);
    }

    expect(customNrc.validate(null).errors[0].code).toBe('INVALID_INPUT_TYPE');
    expect(() => customNrc.parse('bad', 'xx' as never)).toThrow(RangeError);
  });

  it('adds explicitly configured states in numeric order without precision loss', () => {
    const nrc = createNrc({
      additionalData: [
        ...additionalData,
        ...['20', '9007199254740991', '9007199254740990'].map((state) => ({
          state,
          townships: [{ en: 'TestCode', mm: 'ကခဂ' }],
        })),
      ],
    });

    expect(
      nrc
        .getStates()
        .slice(-4)
        .map((state) => state.stateNo),
    ).toEqual([20, 99, 9007199254740990, 9007199254740991]);
    expect(nrc.getStates('mm').find((state) => state.stateNo === 20)).toEqual({
      stateNo: 20,
      name: '၂၀',
    });
    expect(nrc.toMyanmar('99/TestCode(P)001234')).toBe('၉၉/ကခဂ(ပြု)၀၀၁၂၃၄');
    expect(nrc.getTownships(100)).toEqual([]);
  });

  it('deduplicates pairs case-insensitively while preserving canonical order and spelling', () => {
    const nrc = createNrc({
      additionalData: [
        { state: '12', townships: [{ en: 'lamana', mm: 'လမန' }] },
        ...additionalData,
        ...additionalData,
      ],
    });

    expect(nrc.getTownships(12)).toEqual(customNrc.getTownships(12));
    expect(nrc.toEnglish('12/lamana(N)001234')).toBe('12/LaMaNa(N)001234');
    expect(nrc.getTownships(99)).toHaveLength(1);
  });

  it('isolates instances, input configuration and returned values', () => {
    const config = {
      additionalData: structuredClone(additionalData).map((group) => ({
        state: group.state,
        townships: group.townships.map((township) => ({
          en: String(township.en),
          mm: String(township.mm),
        })),
      })),
    };
    const nrc = createNrc(config);

    config.additionalData[0].townships[0].en = 'Changed';
    nrc.getTownships(12)[0].mm = 'Changed';
    nrc.getTownships(99)[0].mm = 'Changed';
    nrc.getStates()[0].name = 'Changed';

    expect(nrc.toEnglish('12/TestCode(N)001234')).toBe('12/TestCode(N)001234');
    expect(nrc.getTownships(99)[0].mm).toBe('ကခဂ');
    expect(nrc.getStates()[0].name).toBe('Kachin');
    expect(nrc.getTownships(12)[0]).toEqual(defaults.getTownships(12)[0]);
    expect(defaults.isValid('12/TestCode(N)001234')).toBe(false);
    expect(createNrc().getStates()).toEqual(defaults.getStates());
    expect(createNrc({ additionalData: [] }).getTownships(12)).toEqual(
      defaults.getTownships(12),
    );
    expect(
      createNrc({
        additionalData: [
          { state: '12', townships: [{ en: 'OtherCode', mm: 'ကခဃ' }] },
        ],
      }).isValid('12/TestCode(N)001234'),
    ).toBe(false);
  });

  it.each([
    null,
    [],
    { additionalData: null },
    { additionalData: false },
    { additionalData: [null] },
    {
      additionalData: [
        { state: '012', townships: [{ en: 'Code', mm: 'ကခဂ' }] },
      ],
    },
    {
      additionalData: [{ state: '0', townships: [{ en: 'Code', mm: 'ကခဂ' }] }],
    },
    { additionalData: [{ state: 12, townships: [{ en: 'Code', mm: 'ကခဂ' }] }] },
    {
      additionalData: [
        { state: '12\n', townships: [{ en: 'Code', mm: 'ကခဂ' }] },
      ],
    },
    { additionalData: [{ state: '12', townships: [] }] },
    { additionalData: [{ state: '12', townships: [{ en: 'Code' }] }] },
    {
      additionalData: [
        { state: '12', townships: [{ en: '<script>', mm: 'ကခဂ' }] },
      ],
    },
    {
      additionalData: [
        { state: '12', townships: [{ en: 'Code\n', mm: 'ကခဂ' }] },
      ],
    },
    {
      additionalData: [
        { state: '12', townships: [{ en: 'Code', mm: 'ကခဂ\n' }] },
      ],
    },
    {
      additionalData: [
        { state: '12', townships: [{ en: 'Code', mm: 'wrong' }] },
      ],
    },
    {
      additionalData: [
        { state: '12', townships: [{ en: 'Code', mm: 'ကခဂ', alias: 'bad' }] },
      ],
    },
    {
      additionalData: [
        { state: '12', townships: [{ en: 'Code', mm: 'ကခဂ' }], extra: true },
      ],
    },
    { additionalData: Array(1) },
    { additionalData: [{ state: '12', townships: Array(1) }] },
  ])('rejects malformed configuration %#', (config) => {
    expect(() => createNrc(config as never)).toThrow(TypeError);
  });

  it.each([
    [{ state: '12', townships: [{ en: 'LaMaNa', mm: 'ကခဂ' }] }],
    [{ state: '12', townships: [{ en: 'TestCode', mm: 'လမန' }] }],
    [
      ...additionalData,
      { state: '12', townships: [{ en: 'testcode', mm: 'ကခဃ' }] },
    ],
    [
      ...additionalData,
      { state: '12', townships: [{ en: 'OtherCode', mm: 'ကခဂ' }] },
    ],
    [{ state: '9007199254740992', townships: [{ en: 'Code', mm: 'ကခဂ' }] }],
    [{ state: '12', townships: [{ en: 'A'.repeat(250), mm: 'ကခဂ' }] }],
    [{ state: '12', townships: [{ en: 'Code', mm: 'က'.repeat(250) }] }],
  ])('rejects conflicts and unusable lengths %#', (...records) => {
    expect(() => createNrc({ additionalData: records })).toThrow(RangeError);
    expect(defaults.isValid('12/TestCode(N)001234')).toBe(false);
  });
});
