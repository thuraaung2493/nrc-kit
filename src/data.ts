import snapshot from '../data/nrc.json';

export interface Township {
  readonly en: string;
  readonly mm: string;
}

export interface StateGroup {
  readonly state: string;
  readonly townships: readonly Township[];
}

export interface NrcConfig {
  readonly additionalData?: readonly StateGroup[];
}

function hasFields(
  value: unknown,
  fields: string[],
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  );
}

function checkedGroup(value: unknown, path: string): StateGroup {
  if (
    !hasFields(value, ['state', 'townships']) ||
    typeof value.state !== 'string' ||
    !/^[1-9]/.test(value.state) ||
    /[^0-9]/.test(value.state) ||
    !Array.isArray(value.townships) ||
    value.townships.length === 0
  )
    throw new TypeError(
      `${path} must contain a canonical state string and a non-empty townships array.`,
    );

  if (!Number.isSafeInteger(Number(value.state)))
    throw new RangeError(`${path}.state must be a safe integer state number.`);

  const state = value.state;
  const townships = Array.from(value.townships, (entry: unknown, index) => {
    const location = `${path}.townships.${index}`;

    if (
      !hasFields(entry, ['en', 'mm']) ||
      typeof entry.en !== 'string' ||
      typeof entry.mm !== 'string' ||
      !entry.en ||
      /[^A-Za-z]/.test(entry.en) ||
      !entry.mm ||
      /[^\u1000-\u109f]/u.test(entry.mm)
    )
      throw new TypeError(
        `${location} must contain English and Myanmar township code strings (en and mm).`,
      );

    if (
      `${state}/${entry.en}(N)000000`.length > 256 ||
      `${state}/${entry.mm}(နိုင်)၀၀၀၀၀၀`.length > 256
    )
      throw new RangeError(
        `${location} exceeds the supported NRC input length.`,
      );

    return { en: entry.en, mm: entry.mm };
  });

  return { state, townships };
}

export function mergeData(config: NrcConfig): StateGroup[] {
  if (!config || typeof config !== 'object' || Array.isArray(config))
    throw new TypeError('NRC configuration must be an object.');

  const additional =
    config.additionalData === undefined ? [] : config.additionalData;

  if (!Array.isArray(additional))
    throw new TypeError('additionalData must be an array of state groups.');

  const groups = new Map(
    snapshot.map((group) => [
      group.state,
      {
        state: group.state,
        townships: group.townships.map((township) => ({ ...township })),
      },
    ]),
  );

  for (const [index, entry] of additional.entries()) {
    const path = `additionalData.${index}`;
    const group = checkedGroup(entry, path);
    const current = groups.get(group.state) ?? {
      state: group.state,
      townships: [],
    };

    for (const township of group.townships) {
      const existing = current.townships.find(
        (candidate) =>
          candidate.en.toLowerCase() === township.en.toLowerCase() ||
          candidate.mm === township.mm,
      );

      if (existing) {
        if (
          existing.en.toLowerCase() !== township.en.toLowerCase() ||
          existing.mm !== township.mm
        )
          throw new RangeError(
            `${path} conflicts with an existing township code in state ${group.state}.`,
          );

        continue;
      }

      current.townships.push({ ...township });
    }

    groups.set(group.state, current);
  }

  return [...groups.values()].sort(
    (left, right) =>
      left.state.length - right.state.length ||
      left.state.localeCompare(right.state),
  );
}
