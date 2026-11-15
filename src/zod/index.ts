import { z } from 'zod';
import * as defaultNrc from '../core';
import type { NrcKit } from '../core';

export function nrcSchema(options: { message?: string; nrc?: NrcKit } = {}) {
  const nrc = options.nrc ?? defaultNrc;

  return z.string().refine(nrc.isValid, {
    message:
      options.message ??
      'Enter a valid Myanmar NRC with a known state/township and six-digit serial.',
  });
}
