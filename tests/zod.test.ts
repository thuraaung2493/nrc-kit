import { it, expect } from 'vitest';
import { z } from 'zod';
import { nrcSchema } from '../src/zod';
import { customNrc } from './additional-data';

it('accepts associate and monk types while excluding Nun', () => {
  for (const value of [
    '12/LaMaNa(E)001234',
    '12/LaMaNa(AE)001234',
    '၁၂/လမန(သ)၀၀၁၂၃၄',
  ])
    expect(nrcSchema().parse(value)).toBe(value);

  expect(nrcSchema().safeParse('12/LaMaNa(သီ)001234').success).toBe(false);
});

it('uses the same configured instance without affecting default schemas', () => {
  const schema = nrcSchema({ nrc: customNrc, message: 'Custom reference' });

  for (const input of ['12/TestCode(P)001234', '၉၉/ကခဂ(နိုင်)၀၀၁၂၃၄']) {
    expect(schema.parse(input)).toBe(input);
    expect(nrcSchema().safeParse(input).success).toBe(false);
  }

  for (const input of [
    '1/TestCode(N)001234',
    '99/TestCode(X)001234',
    '99/TestCode(N)12345',
  ])
    expect(schema.safeParse(input).error?.issues[0].message).toBe(
      'Custom reference',
    );

  expect(schema.safeParse(123).error?.issues[0].code).toBe('invalid_type');
});

it('validates English and Myanmar without transforming', () => {
  for (const value of [
    '12/LaMaNa(N)001234',
    '၁၂/လမန(နိုင်)၀၀၁၂၃၄',
    ' 12/lamana(Naing)001234 ',
  ])
    expect(nrcSchema().parse(value)).toBe(value);
});

it('rejects invalid values and honors custom messages', () => {
  for (const value of [
    'bad',
    '1/LaMaNa(N)001234',
    '12/LaMaNa(N)12345',
    123,
    null,
    undefined,
  ])
    expect(nrcSchema().safeParse(value).success).toBe(false);

  const result = nrcSchema().safeParse('bad');

  expect(result.error?.issues[0].message).toContain('known state/township');
  expect(
    nrcSchema({ message: 'Custom' }).safeParse('bad').error?.issues[0].message,
  ).toBe('Custom');
});

it('works in z.object and preserves normal non-string errors', () => {
  expect(
    z.object({ nrc: nrcSchema() }).safeParse({ nrc: '12/LaMaNa(P)000000' })
      .success,
  ).toBe(true);

  const issue = nrcSchema({ message: 'Custom' }).safeParse(123).error
    ?.issues[0];

  expect(issue?.code).toBe('invalid_type');
  expect(issue?.message).not.toBe('Custom');
});
