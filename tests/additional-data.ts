import { createNrc } from '../src';

// Synthetic application records for tests only; never part of the snapshot.
export const additionalData = [
  { state: '12', townships: [{ en: 'TestCode', mm: 'ကခဂ' }] },
  { state: '99', townships: [{ en: 'TestCode', mm: 'ကခဂ' }] },
] as const;

export const customNrc = createNrc({ additionalData });
