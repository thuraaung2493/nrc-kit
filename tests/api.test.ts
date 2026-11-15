import { describe, expect, it } from 'vitest';
import * as nrc from '../src';

const types = [
  { en: 'N', mm: 'နိုင်', label: 'Full Citizen (Naing-ngan-tha)' },
  { en: 'E', mm: 'ဧည့်', label: 'Associate Citizen (Aye-naing-ngan-tha)' },
  { en: 'P', mm: 'ပြု', label: 'Naturalized Citizen (Pyu-su-khwint-ya-thu)' },
  { en: 'M', mm: 'သ', label: 'Monk (Tharthana-win)' },
];

describe('named reference APIs', () => {
  it('returns bilingual types with English descriptions and isolated results', () => {
    expect(nrc.getTypes('mm').map((type) => type.label)).toEqual([
      'နိုင်ငံသား',
      'ဧည့်နိုင်ငံသား',
      'နိုင်ငံသားပြုခွင့်ရသူ',
      'သာသနာဝင်',
    ]);
    expect(nrc.getTypes('en')).toEqual(types);
    expect(nrc.getTypes()).toEqual(types);

    nrc.getTypes()[0].label = 'changed';

    expect(nrc.getTypes()[0].label).toBe('Full Citizen (Naing-ngan-tha)');
  });

  it('lists named regions including both regions that use state number 9', () => {
    expect(nrc.getStates('en')).toEqual([
      { stateNo: 1, name: 'Kachin' },
      { stateNo: 2, name: 'Kayah' },
      { stateNo: 3, name: 'Kayin' },
      { stateNo: 4, name: 'Chin' },
      { stateNo: 5, name: 'Sagaing' },
      { stateNo: 6, name: 'Tanintharyi' },
      { stateNo: 7, name: 'Bago' },
      { stateNo: 8, name: 'Magway' },
      { stateNo: 9, name: 'Naypyidaw' },
      { stateNo: 9, name: 'Mandalay' },
      { stateNo: 10, name: 'Mon' },
      { stateNo: 11, name: 'Rakhine' },
      { stateNo: 12, name: 'Yangon' },
      { stateNo: 13, name: 'Shan' },
      { stateNo: 14, name: 'Ayeyarwady' },
    ]);
    expect(
      nrc.getStates('mm').find((state) => state.stateNo === 12)?.name,
    ).toBe('ရန်ကုန်တိုင်း');
  });

  it('returns township pairs by default and strings for an explicit language', () => {
    expect(nrc.getTownships(10).slice(0, 2)).toEqual([
      { en: 'MaLaMa', mm: 'မလမ' },
      { en: 'KaMaRa', mm: 'ကမရ' },
    ]);
    expect(nrc.getTownships(12, 'en').slice(0, 4)).toEqual([
      'ThaGaKa',
      'RaKaNa',
      'UKaTa',
      'UKaMa',
    ]);
    expect(nrc.getTownships('၁၂', 'mm')).toContain('လမန');
    expect(nrc.getTownships(99)).toEqual([]);
    expect(nrc.getTownships(99, 'en')).toEqual([]);
    expect('getTownshipOptions' in nrc).toBe(false);
    expect('getTownshipOptions' in nrc.createNrc()).toBe(false);
  });

  it('adds localized state names and descriptive type names to parsing', () => {
    expect(nrc.parse('12/LaMaNa(N)001234', 'mm')).toEqual({
      state: '၁၂',
      stateName: 'ရန်ကုန်တိုင်း',
      township: 'လမန',
      type: 'နိုင်',
      typeName: 'နိုင်ငံသား',
      number: '၀၀၁၂၃၄',
      language: 'mm',
    });
    expect(nrc.parse('၁၂/လမန(နိုင်)၀၀၁၂၃၄', 'en')).toEqual({
      state: '12',
      stateName: 'Yangon',
      township: 'LaMaNa',
      type: 'N',
      typeName: 'Full Citizen (Naing-ngan-tha)',
      number: '001234',
      language: 'en',
    });
    expect(nrc.parse('12/LaMaNa(P)001234', 'mm')).toMatchObject({
      stateName: 'ရန်ကုန်တိုင်း',
      typeName: 'နိုင်ငံသားပြုခွင့်ရသူ',
    });

    for (const code of [
      'UTaTha',
      'ZaYaTha',
      'PaBaTha',
      'TaKaNa',
      'DaKhaTha',
      'ZaBaTha',
      'PaMaNa',
      'LaWaNa',
    ])
      expect(nrc.parse(`9/${code}(N)001234`, 'en')?.stateName).toBe(
        'Naypyidaw',
      );

    expect(nrc.parse('9/MaNaMa(M)001234', 'en')?.stateName).toBe('Mandalay');
    expect(nrc.parse('၉/ဥတသ(နိုင်)၀၀၁၂၃၄')?.stateName).toBe('နေပြည်တော်');
  });

  it('converts E/AE and M without supporting Nun or changing N', () => {
    for (const type of types) {
      const english = `12/LaMaNa(${type.en})001234`;
      const myanmar = `၁၂/လမန(${type.mm})၀၀၁၂၃၄`;

      expect(nrc.toMyanmar(english)).toBe(myanmar);
      expect(nrc.toEnglish(myanmar)).toBe(english);
      expect(nrc.parse(english)?.typeName).toBe(type.label);
      expect(
        nrc.formatNrc(
          { state: '12', township: 'LaMaNa', type: type.en, number: '001234' },
          'mm',
        ),
      ).toBe(myanmar);
    }

    expect(nrc.toEnglish('12/LaMaNa(ae)001234')).toBe('12/LaMaNa(E)001234');
    expect(nrc.toEnglish('12/LaMaNa(ဧည့်)001234')).toBe('12/LaMaNa(E)001234');
    expect(nrc.validate('12/LaMaNa(သီ)001234').errors[0].code).toBe(
      'INVALID_TYPE',
    );
    expect(nrc.validate('12/LaMaNa(Nun)001234').errors[0].code).toBe(
      'INVALID_TYPE',
    );
    expect(nrc.parse('12/LaMaNa(N)001234')?.typeName).toBe(
      'Full Citizen (Naing-ngan-tha)',
    );
    expect(nrc.isValid('1/LaMaNa(E)001234')).toBe(false);
    expect(nrc.isValid('12/LaMaNa(M)12345')).toBe(false);
  });
});
