'use client';

import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import * as defaultNrc from '../core';
import { convertNumbers } from '../core';
import type { InputLanguage, NrcKit, NrcParts, Option } from '../core';

export interface NrcSelectorProps {
  nrc?: NrcKit;
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  language?: 'auto' | 'en' | 'mm';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const labels = {
  en: {
    state: 'State/Region',
    township: 'Township',
    type: 'NRC Type',
    number: 'Six-digit Number',
    choose: 'Select',
    placeholder: '001234',
    invalid: 'Enter a complete valid NRC.',
  },
  mm: {
    state: 'ပြည်နယ်/တိုင်း',
    township: 'မြို့နယ်',
    type: 'နိုင်ငံသားအမျိုးအစား',
    number: 'ဂဏန်းခြောက်လုံး',
    choose: 'ရွေးချယ်ပါ',
    placeholder: '၀၀၁၂၃၄',
    invalid: 'မှန်ကန်သော နိုင်ငံသားစိစစ်ရေးကတ်အမှတ်ကို အပြည့်အစုံဖြည့်ပါ။',
  },
};

const empty = (): NrcParts => ({
  state: '',
  township: '',
  type: '',
  number: '',
});

function initial(value: string | undefined, nrc: NrcKit) {
  const parsed = nrc.parse(value, 'en');
  const parts = parsed
    ? {
        state: parsed.state,
        township: parsed.township,
        type: parsed.type,
        number: parsed.number,
      }
    : empty();

  return {
    nrc,
    parts,
    inputLanguage: nrc.parse(value)?.language ?? 'en',
    invalidPreset: Boolean(value) && !parsed,
    seenValue: value,
    emitted: null as string | null,
  };
}

function formatted(
  parts: NrcParts,
  language: InputLanguage,
  nrc: NrcKit,
): string {
  if (!parts.state || !parts.township || !parts.type || !parts.number)
    return '';

  try {
    return nrc.formatNrc(parts, language);
  } catch {
    return '';
  }
}

/** The forwarded ref focuses the first visible select, including from form libraries. */
export const NrcSelector = forwardRef<HTMLSelectElement, NrcSelectorProps>(
  function NrcSelector(
    {
      nrc = defaultNrc,
      name = 'nrc',
      id,
      value,
      defaultValue,
      onChange,
      onBlur,
      language = 'auto',
      required = false,
      disabled = false,
      error,
      className,
    },
    ref,
  ) {
    if (language !== 'auto' && language !== 'en' && language !== 'mm')
      throw new RangeError('Selector language must be auto, en, or mm.');

    const generatedId = useId();
    const controlId = id ?? `nrc-${generatedId}`;
    const controlled = useRef(value !== undefined).current;
    const original = useRef(controlled ? value : defaultValue).current;
    const [model, setModel] = useState(() => initial(original, nrc));

    // Acknowledge our own empty emissions without erasing the user's partial entry.
    if (model.nrc !== nrc) {
      setModel(initial(controlled ? value : original, nrc));
    } else if (controlled && value !== model.seenValue) {
      setModel(
        value === model.emitted
          ? { ...model, seenValue: value, emitted: null }
          : initial(value, nrc),
      );
    }

    const activeLanguage = language === 'auto' ? model.inputLanguage : language;
    const text = labels[activeLanguage];
    const output = formatted(model.parts, activeLanguage, nrc);
    const presetError = model.invalidPreset ? text.invalid : '';
    const message = error || presetError;

    const numberRef = useRef<HTMLInputElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const priorLanguage = useRef(activeLanguage);

    useEffect(() => {
      const partial = Object.values(model.parts).some(Boolean);

      numberRef.current?.setCustomValidity(
        (partial || model.invalidPreset) && !output ? text.invalid : '',
      );
    }, [model.parts, model.invalidPreset, output, text.invalid]);

    useEffect(() => {
      if (priorLanguage.current === activeLanguage) return;

      priorLanguage.current = activeLanguage;
      setModel((current) => ({ ...current, emitted: output }));
      onChange?.(output);
    }, [activeLanguage, output, onChange]);

    useEffect(() => {
      if (controlled) return;

      const form = hiddenRef.current?.form;
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented) return;

          const next = initial(original, nrc);
          setModel(next);
          onChange?.(
            formatted(
              next.parts,
              language === 'auto' ? next.inputLanguage : language,
              nrc,
            ),
          );
        });
      };

      form?.addEventListener('reset', reset);

      return () => form?.removeEventListener('reset', reset);
    }, [controlled, original, language, onChange, nrc]);

    function change(field: keyof NrcParts, nextValue: string) {
      const parts = {
        ...model.parts,
        [field]:
          field === 'number'
            ? convertNumbers(nextValue, 'mm', 'en')
            : nextValue,
      };

      if (
        field === 'state' &&
        !nrc.getTownships(nextValue).some((t) => t.en === parts.township)
      )
        parts.township = '';

      const next = formatted(parts, activeLanguage, nrc);
      setModel({ ...model, parts, emitted: next, invalidPreset: false });
      onChange?.(next);
    }

    const common = {
      required,
      disabled,
      'aria-invalid': Boolean(message),
      'aria-describedby': message ? `${controlId}-error` : undefined,
    };
    const states = new Map<string, Option>();

    for (const state of nrc.getStates(activeLanguage)) {
      const value = String(state.stateNo);
      const previous = states.get(value);
      states.set(value, {
        value,
        label: previous ? `${previous.label} / ${state.name}` : state.name,
      });
    }

    const options = {
      state: [...states.values()],
      township: nrc.getTownships(model.parts.state).map((township) => ({
        value: township.en,
        label: township[activeLanguage],
      })),
      type: nrc
        .getTypes()
        .map((type) => ({ value: type.en, label: type[activeLanguage] })),
    };

    return (
      <div
        className={['nrc-selector', className].filter(Boolean).join(' ')}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
        }}
      >
        {(['state', 'township', 'type'] as const).map((field) => (
          <div key={field}>
            <label htmlFor={`${controlId}-${field}`}>{text[field]}</label>
            <select
              {...common}
              id={`${controlId}-${field}`}
              ref={field === 'state' ? ref : undefined}
              value={model.parts[field]}
              onChange={(event) => change(field, event.target.value)}
            >
              <option value="">{text.choose}</option>
              {options[field].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <label htmlFor={`${controlId}-number`}>{text.number}</label>
          <input
            {...common}
            ref={numberRef}
            id={`${controlId}-number`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9၀-၉]{6}"
            maxLength={6}
            placeholder={text.placeholder}
            value={convertNumbers(model.parts.number, 'en', activeLanguage)}
            onChange={(event) => change('number', event.target.value)}
          />
        </div>
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          value={output}
          disabled={disabled}
        />
        {message ? (
          <span id={`${controlId}-error`} role="alert">
            {message}
          </span>
        ) : null}
      </div>
    );
  },
);
