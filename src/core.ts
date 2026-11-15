import snapshot from '../data/nrc.json';
import metadata from '../data/nrc-metadata.json';
import { mergeData } from './data';
import type { NrcConfig, StateGroup } from './data';

export type Language = 'en' | 'mm' | 'eng';
export type ParseLanguage = Language | 'auto';
export type InputLanguage = 'en' | 'mm';

export interface NrcParts {
  state: string;
  township: string;
  type: string;
  number: string;
}

export interface ParsedNrc extends NrcParts {
  stateName: string;
  typeName: string;
  language: InputLanguage;
}

export interface Option {
  value: string;
  label: string;
}

export interface StateInfo {
  stateNo: number;
  name: string;
}

export interface NrcType {
  en: string;
  mm: string;
  label: string;
}

export type ErrorCode =
  | 'INVALID_INPUT_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_STATE'
  | 'INVALID_TOWNSHIP'
  | 'INVALID_TYPE'
  | 'INVALID_SERIAL_LENGTH';

export interface ValidationResult {
  valid: boolean;
  errors: { code: ErrorCode; message: string }[];
}

const mmDigits = '၀၁၂၃၄၅၆၇၈၉';
interface TypeDefinition extends NrcType {
  labelMm: string;
}

const types: readonly TypeDefinition[] = metadata.types;
const aliases = new Map<string, TypeDefinition>();

for (const type of types) {
  aliases.set(type.en.toLowerCase(), type);
  aliases.set(type.mm, type);
}

for (const [alias, code] of Object.entries({
  naing: 'N',
  pyu: 'P',
  ae: 'E',
  ဧည့်: 'E',
})) {
  const type = types.find((entry) => entry.en === code);

  if (type) aliases.set(alias, type);
}

const whitespace =
  '[\\t\\n\\v\\f\\r \\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]';
const syntax = new RegExp(
  `^${whitespace}*([0-9၀-၉]+)${whitespace}*/${whitespace}*([A-Za-z\\u1000-\\u109f]+)${whitespace}*\\(${whitespace}*([A-Za-z\\u1000-\\u109f]+)${whitespace}*\\)${whitespace}*([0-9၀-၉]+)${whitespace}*$`,
  'u',
);

const messages: Record<ErrorCode, string> = {
  INVALID_INPUT_TYPE: 'NRC must be a string.',
  INVALID_FORMAT: 'Expected state/township(type) followed by digits.',
  INVALID_STATE: 'Unknown NRC state number.',
  INVALID_TOWNSHIP: 'Township does not belong to the state.',
  INVALID_TYPE: 'Expected N (နိုင်), E (ဧည့်), P (ပြု), or M (သ).',
  INVALID_SERIAL_LENGTH: 'NRC serial must contain exactly six digits.',
};

export function locale(language: Language): InputLanguage {
  if (language === 'eng') return 'en';

  if (language === 'en' || language === 'mm') return language;

  throw new RangeError('Language must be en, eng, or mm.');
}

export function convertNumbers(
  input: string,
  from: Language,
  to: Language,
): string {
  if (typeof input !== 'string')
    throw new TypeError('Digits must be a string.');

  locale(from);
  const target = locale(to);
  const english = input.replace(/[၀-၉]/g, (digit) =>
    String(mmDigits.indexOf(digit)),
  );

  return target === 'en'
    ? english
    : english.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

const digits = (input: string) => convertNumbers(input, 'mm', 'en');

function stateName(
  state: string,
  township: string,
  language: InputLanguage,
): string {
  const names = metadata.states.filter(
    (entry) => String(entry.stateNo) === state,
  );
  const match = names.find((entry) =>
    entry.townships?.some(
      (code) => code.toLowerCase() === township.toLowerCase(),
    ),
  );

  return (
    match?.[language] ??
    (names.length
      ? names.map((entry) => entry[language]).join(' / ')
      : convertNumbers(state, 'en', language))
  );
}

function createInstance(reference: readonly StateGroup[]) {
  const groups = new Map(reference.map((group) => [group.state, group]));
  const townshipMaps = new Map(
    reference.map((group) => [
      group.state,
      new Map(
        group.townships.flatMap((t) => [
          [t.en.toLowerCase(), t],
          [t.mm, t],
        ]),
      ),
    ]),
  );

  function read(input: unknown): {
    parsed: ParsedNrc | null;
    result: ValidationResult;
  } {
    const errors: ValidationResult['errors'] = [];
    const add = (code: ErrorCode) =>
      errors.push({ code, message: messages[code] });

    if (typeof input !== 'string') add('INVALID_INPUT_TYPE');

    // Whitespace is allowed around delimiters, never inside a component.
    const match =
      typeof input === 'string' && input.length <= 256
        ? syntax.exec(input)
        : null;

    if (!errors.length && !match) add('INVALID_FORMAT');

    if (!match) return { parsed: null, result: { valid: false, errors } };

    const state = digits(match[1]);
    const township = townshipMaps.get(state)?.get(match[2].toLowerCase());
    const type = aliases.get(match[3].toLowerCase());
    const number = digits(match[4]);

    if (!groups.has(state)) add('INVALID_STATE');
    else if (!township) add('INVALID_TOWNSHIP');

    if (!type) add('INVALID_TYPE');

    if (number.length !== 6) add('INVALID_SERIAL_LENGTH');

    const parsed =
      errors.length || !township || !type
        ? null
        : {
            state,
            stateName: stateName(state, township.en, 'en'),
            township: township.en,
            type: type.en,
            typeName: type.label,
            number,
            language: /^[A-Za-z]+$/.test(match[2])
              ? ('en' as const)
              : ('mm' as const),
          };

    return { parsed, result: { valid: errors.length === 0, errors } };
  }

  function validate(input: unknown): ValidationResult {
    return read(input).result;
  }

  function isValid(input: unknown): input is string {
    return read(input).parsed !== null;
  }

  function parse(
    input: unknown,
    language: ParseLanguage = 'auto',
  ): ParsedNrc | null {
    const target = language === 'auto' ? null : locale(language);
    const value = read(input).parsed;

    if (!value) return null;

    const output = target ?? value.language;
    const type = types.find((entry) => entry.en === value.type)!;
    const township = townshipMaps
      .get(value.state)!
      .get(value.township.toLowerCase())!;

    return {
      state: convertNumbers(value.state, 'en', output),
      stateName: stateName(value.state, value.township, output),
      township: township[output],
      type: type[output],
      typeName: output === 'mm' ? type.labelMm : type.label,
      number: convertNumbers(value.number, 'en', output),
      language: output,
    };
  }

  function convert(input: string, language: Language = 'en'): string {
    const target = locale(language);

    if (typeof input !== 'string') throw new TypeError('NRC must be a string.');

    const value = parse(input, target);

    if (!value) throw new RangeError('Invalid NRC.');

    return `${value.state}/${value.township}(${value.type})${value.number}`;
  }

  const toEnglish = (input: string): string => convert(input, 'en');
  const toMyanmar = (input: string): string => convert(input, 'mm');

  function formatNrc(parts: NrcParts, language: Language = 'en'): string {
    locale(language);

    if (
      !parts ||
      typeof parts !== 'object' ||
      !['state', 'township', 'type', 'number'].every(
        (key) => typeof parts[key as keyof NrcParts] === 'string',
      )
    )
      throw new TypeError(
        'NRC parts must contain string state, township, type, and number.',
      );

    // Each part must be a component, not an injected complete NRC or delimiter.
    if (
      (['state', 'township', 'type', 'number'] as const).some((key) =>
        /[/()]/.test(parts[key]),
      )
    )
      throw new RangeError('Invalid NRC parts.');

    return convert(
      `${parts.state}/${parts.township}(${parts.type})${parts.number}`,
      language,
    );
  }

  function getStates(language: Language = 'en'): StateInfo[] {
    const target = locale(language);

    return reference.flatMap(({ state }) => {
      const names = metadata.states.filter(
        (entry) => String(entry.stateNo) === state,
      );

      return names.length
        ? names.map((entry) => ({
            stateNo: entry.stateNo,
            name: entry[target],
          }))
        : [
            {
              stateNo: Number(state),
              name: convertNumbers(state, 'en', target),
            },
          ];
    });
  }

  function getTownships(state: string | number): { en: string; mm: string }[];
  function getTownships(state: string | number, language: Language): string[];
  function getTownships(
    state: string | number,
    language?: Language,
  ): { en: string; mm: string }[] | string[] {
    const townships = groups.get(digits(String(state)))?.townships ?? [];

    if (language === undefined)
      return townships.map(({ en, mm }) => ({ en, mm }));

    const target = locale(language);

    return townships.map((township) => township[target]);
  }

  return {
    parse,
    validate,
    isValid,
    convert,
    toEnglish,
    toMyanmar,
    formatNrc,
    getStates,
    getTownships,
    getTypes,
    convertNumbers,
  };
}

export type NrcKit = ReturnType<typeof createInstance>;

export function createNrc(config: NrcConfig = {}): NrcKit {
  return createInstance(mergeData(config));
}

export const {
  parse,
  validate,
  isValid,
  convert,
  toEnglish,
  toMyanmar,
  formatNrc,
  getStates,
  getTownships,
} = createInstance(snapshot);

export function getTypes(language: Language = 'en'): NrcType[] {
  const target = locale(language);

  return types.map((type) => ({
    en: type.en,
    mm: type.mm,
    label: target === 'mm' ? type.labelMm : type.label,
  }));
}
