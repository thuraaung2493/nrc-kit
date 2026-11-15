// @vitest-environment jsdom
import React, { useState, createRef } from 'react';
import { afterEach, it, expect, vi } from 'vitest';
import {
  cleanup,
  render,
  fireEvent,
  screen,
  act,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Controller, useForm } from 'react-hook-form';
import { NrcSelector } from '../src/react';
import { createNrc } from '../src';
import { customNrc } from './additional-data';
import cases from './fixtures/nrc-cases.json';

afterEach(cleanup);

it.each([
  ['E', 'ဧည့်'],
  ['M', 'သ'],
])('selects and localizes type %s without losing the serial', (code, mm) => {
  const value = `12/LaMaNa(${code})001234`;
  const { container, rerender } = render(<NrcSelector defaultValue={value} />);

  expect(fields()[2].value).toBe(code);
  expect(hidden(container).value).toBe(value);

  rerender(<NrcSelector language="mm" defaultValue={value} />);

  expect(fields()[2].selectedOptions[0].text).toBe(mm);
  expect(hidden(container).value).toBe(`၁၂/လမန(${mm})၀၀၁၂၃၄`);
  expect(serial().value).toBe('၀၀၁၂၃၄');
});

it('combines shared state number 9 into one selector option', () => {
  const { container, rerender } = render(
    <NrcSelector defaultValue="9/UTaTha(M)001234" />,
  );
  const state = fields()[0];

  expect(
    [...state.options].filter((option) => option.value === '9'),
  ).toHaveLength(1);
  expect(state.selectedOptions[0].text).toBe('Naypyidaw / Mandalay');
  expect(hidden(container).value).toBe('9/UTaTha(M)001234');

  rerender(<NrcSelector language="mm" />);

  expect(fields()[0].selectedOptions[0].text).toBe('နေပြည်တော် / မန္တလေးတိုင်း');
  expect(hidden(container).value).toBe('၉/ဥတသ(သ)၀၀၁၂၃၄');
});

it('uses configured data for presets, localized submission and state changes', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(
    <NrcSelector
      nrc={customNrc}
      defaultValue="12/TestCode(P)001234"
      onChange={onChange}
      required
    />,
  );

  expect(hidden(container).value).toBe('12/TestCode(P)001234');
  expect(fields()[1].selectedOptions[0].text).toBe('TestCode');

  rerender(
    <NrcSelector nrc={customNrc} language="mm" onChange={onChange} required />,
  );
  fireEvent.change(fields()[0], { target: { value: '99' } });

  expect(fields()[1].value).toBe('TestCode');
  expect(fields()[1].selectedOptions[0].text).toBe('ကခဂ');
  expect(serial().value).toBe('၀၀၁၂၃၄');
  expect(hidden(container).value).toBe('၉၉/ကခဂ(ပြု)၀၀၁၂၃၄');
  expect(onChange).toHaveBeenLastCalledWith('၉၉/ကခဂ(ပြု)၀၀၁၂၃၄');

  fireEvent.change(fields()[0], { target: { value: '1' } });

  expect(fields()[1].value).toBe('');
  expect(hidden(container).value).toBe('');
});

it('keeps selectors isolated and reinitializes presets when the instance changes', () => {
  const value = '12/TestCode(N)001234';
  const { container, rerender } = render(
    <>
      <NrcSelector nrc={customNrc} defaultValue={value} />
      <NrcSelector defaultValue={value} />
    </>,
  );

  expect(
    [
      ...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
    ].map((input) => input.value),
  ).toEqual([value, '']);
  expect(screen.getAllByRole('alert')).toHaveLength(1);

  rerender(<NrcSelector nrc={createNrc()} defaultValue={value} />);

  expect(hidden(container).value).toBe('');
  expect(screen.getByRole('alert')).toBeTruthy();

  rerender(<NrcSelector nrc={customNrc} defaultValue={value} />);

  expect(hidden(container).value).toBe(value);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('supports configured data in controlled fields, form reset and SSR hydration', async () => {
  const value = '12/TestCode(P)001234';
  function ControlledCustom() {
    const [current, setCurrent] = useState(value);
    return (
      <NrcSelector nrc={customNrc} value={current} onChange={setCurrent} />
    );
  }
  const controlled = render(<ControlledCustom />);

  fireEvent.change(fields()[0], { target: { value: '99' } });

  expect(hidden(controlled.container).value).toBe('99/TestCode(P)001234');
  controlled.unmount();

  const form = render(
    <form>
      <NrcSelector nrc={customNrc} defaultValue={value} />
    </form>,
  );
  fireEvent.change(fields()[0], { target: { value: '99' } });
  await act(async () => {
    form.container.querySelector('form')!.reset();
    await Promise.resolve();
  });

  expect(hidden(form.container).value).toBe(value);
  form.unmount();

  const element = (
    <NrcSelector nrc={customNrc} defaultValue={value} language="mm" />
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  document.body.append(container);
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, element);
    await Promise.resolve();
  });

  expect(hidden(container).value).toBe('၁၂/ကခဂ(ပြု)၀၀၁၂၃၄');
  expect(
    container.querySelector('input[type="text"]')?.getAttribute('value'),
  ).toBe('၀၀၁၂၃၄');

  act(() => root.unmount());
  container.remove();
});

const english = '12/LaMaNa(N)001234';
const myanmar = '၁၂/လမန(နိုင်)၀၀၁၂၃၄';

const hidden = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
const serial = () => screen.getByRole<HTMLInputElement>('textbox');

function fields() {
  return screen.getAllByRole<HTMLSelectElement>('combobox');
}

function fill() {
  fireEvent.change(fields()[0], { target: { value: '12' } });
  fireEvent.change(fields()[1], { target: { value: 'LaMaNa' } });
  fireEvent.change(fields()[2], { target: { value: 'N' } });
  fireEvent.change(serial(), { target: { value: '၀0၁၂၃၄' } });
}

for (const [i, fixture] of cases.entries())
  it('matches shared selector fixture ' + i, () => {
    const { container } = render(
      <NrcSelector
        defaultValue={
          typeof fixture.input === 'string' ? fixture.input : 'invalid'
        }
      />,
    );

    expect(hidden(container).value).toBe(
      fixture.errors ? '' : fixture.language === 'mm' ? fixture.mm : fixture.en,
    );

    if (fixture.errors && fixture.input !== '')
      expect(screen.getByRole('alert').textContent).toBeTruthy();
  });

it('localizes all four fields, options, and submission; preserves state on language changes', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(
    <NrcSelector defaultValue={english} onChange={onChange} />,
  );

  rerender(
    <NrcSelector defaultValue={english} language="mm" onChange={onChange} />,
  );

  for (const label of ['ပြည်နယ်/တိုင်း', 'မြို့နယ်', 'နိုင်ငံသားအမျိုးအစား', 'ဂဏန်းခြောက်လုံး'])
    expect(screen.getByLabelText(label)).toBeTruthy();

  expect(fields().map((f) => f.selectedOptions[0].text)).toEqual([
    'ရန်ကုန်တိုင်း',
    'လမန',
    'နိုင်',
  ]);
  expect(serial().placeholder).toBe('၀၀၁၂၃၄');
  expect(serial().value).toBe('၀၀၁၂၃၄');
  expect(hidden(container).value).toBe(myanmar);
  expect(onChange).toHaveBeenLastCalledWith(myanmar);

  rerender(<NrcSelector language="en" onChange={onChange} />);

  expect(serial().value).toBe('001234');
  expect(hidden(container).value).toBe(english);
});

it('preserves partial entries during controlled empty acknowledgments and resets on external value changes', () => {
  function Controlled() {
    const [value, setValue] = useState('');

    return (
      <>
        <NrcSelector value={value} onChange={setValue} />
        <button onClick={() => setValue(english)}>Preset</button>
        <button onClick={() => setValue('')}>Clear</button>
      </>
    );
  }

  const { container } = render(<Controlled />);

  fill();

  expect(hidden(container).value).toBe(english);

  fireEvent.change(serial(), { target: { value: '00' } });

  expect(serial().value).toBe('00');
  expect(fields()[1].value).toBe('LaMaNa');
  expect(hidden(container).value).toBe('');

  fireEvent.click(screen.getByText('Preset'));

  expect(serial().value).toBe('001234');

  fireEvent.click(screen.getByText('Clear'));

  expect(serial().value).toBe('');
  expect(fields()[0].value).toBe('');
});

it('clears invalid township, retains serial and supports uncontrolled change emission', () => {
  const onChange = vi.fn();

  render(<NrcSelector defaultValue={english} onChange={onChange} />);
  fireEvent.change(fields()[0], { target: { value: '1' } });

  expect(fields()[1].value).toBe('');
  expect(serial().value).toBe('001234');
  expect(onChange).toHaveBeenLastCalledWith('');
  expect(serial().checkValidity()).toBe(false);

  fireEvent.change(fields()[1], { target: { value: 'MaKaNa' } });

  expect(onChange).toHaveBeenLastCalledWith('1/MaKaNa(N)001234');
});

it('submits exactly one field; honors required, errors, disabled and ref focus', async () => {
  const ref = createRef<HTMLSelectElement>();
  const onBlur = vi.fn();
  const { container, rerender } = render(
    <form>
      <NrcSelector ref={ref} required error="Example error" onBlur={onBlur} />
      <button>Submit</button>
    </form>,
  );

  expect(fields().every((f) => f.required)).toBe(true);
  expect(serial().required).toBe(true);
  expect(container.querySelector('form')!.checkValidity()).toBe(false);
  expect(serial().getAttribute('aria-invalid')).toBe('true');
  expect(
    document.getElementById(serial().getAttribute('aria-describedby')!)!
      .textContent,
  ).toBe('Example error');

  const user = userEvent.setup();
  ref.current!.focus();

  expect(document.activeElement).toBe(fields()[0]);

  await user.tab();

  expect(document.activeElement).toBe(fields()[1]);

  await user.tab();
  await user.tab();
  await user.tab();

  expect(onBlur).toHaveBeenCalledOnce();

  fill();

  expect(new FormData(container.querySelector('form')!).getAll('nrc')).toEqual([
    english,
  ]);

  rerender(
    <form>
      <NrcSelector defaultValue={english} disabled />
    </form>,
  );

  expect(
    [...container.querySelectorAll('select,input')].every(
      (el) => (el as HTMLInputElement).disabled,
    ),
  ).toBe(true);
  expect(new FormData(container.querySelector('form')!).has('nrc')).toBe(false);
});

it('generates distinct IDs and hydrates SSR markup without mismatches', async () => {
  const elements = (
    <>
      <NrcSelector defaultValue={myanmar} />
      <NrcSelector defaultValue={english} />
    </>
  );
  const container = document.createElement('div');
  document.body.append(container);
  container.innerHTML = renderToString(elements);

  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);

  expect(new Set(ids).size).toBe(ids.length);

  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot>;

  await act(() => {
    root = hydrateRoot(container, elements);

    return Promise.resolve();
  });

  expect(error).not.toHaveBeenCalled();
  expect([...container.querySelectorAll('[id]')].map((el) => el.id)).toEqual(
    ids,
  );

  await act(() => {
    root!.unmount();

    return Promise.resolve();
  });
  container.remove();
  error.mockRestore();
});

it('works with React Hook Form Controller including blur, submit, reset and focus', async () => {
  const submitted = vi.fn();

  function Form() {
    const { control, handleSubmit, reset, setFocus } = useForm({
      defaultValues: { nrc: '' },
    });

    return (
      <form
        onSubmit={(event) => {
          void handleSubmit(submitted)(event);
        }}
      >
        <Controller
          name="nrc"
          control={control}
          render={({ field }) => <NrcSelector {...field} required />}
        />
        <button type="submit">Save</button>
        <button type="button" onClick={() => reset({ nrc: '' })}>
          Reset
        </button>
        <button type="button" onClick={() => setFocus('nrc')}>
          Focus
        </button>
      </form>
    );
  }

  render(<Form />);
  fill();
  await userEvent.setup().click(screen.getByText('Save'));
  await waitFor(() => expect(submitted).toHaveBeenCalled());

  expect(submitted.mock.calls[0][0]).toEqual({ nrc: english });

  fireEvent.click(screen.getByText('Focus'));
  await waitFor(() => expect(document.activeElement).toBe(fields()[0]));

  fireEvent.click(screen.getByText('Reset'));

  expect(serial().value).toBe('');
});

it('gives controlled value precedence and handles uncontrolled native form reset', async () => {
  const { container } = render(
    <form>
      <NrcSelector defaultValue={english} />
    </form>,
  );

  fireEvent.change(serial(), { target: { value: '123456' } });

  expect(serial().value).toBe('123456');

  await act(() => {
    container.querySelector('form')!.reset();

    return Promise.resolve();
  });

  expect(serial().value).toBe('001234');

  cleanup();
  render(<NrcSelector value={myanmar} defaultValue={english} />);

  expect(serial().value).toBe('၀၀၁၂၃၄');
});

it('allows an optional prefilled selector to be completely cleared by hand', () => {
  const { container } = render(
    <form>
      <NrcSelector defaultValue={english} />
    </form>,
  );

  for (const index of [0, 1, 2])
    fireEvent.change(fields()[index], { target: { value: '' } });

  fireEvent.change(serial(), { target: { value: '' } });

  expect(hidden(container).value).toBe('');
  expect(container.querySelector('form')!.checkValidity()).toBe(true);
});
