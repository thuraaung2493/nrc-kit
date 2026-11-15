import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NrcSelector } from '../dist/react/index.js';

const result = await build({
  entryPoints: ['tests/browser.tsx'],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  headless: true,
});

try {
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', (e) => failures.push(e.message));
  await page.setContent('<div id="app"></div>');
  await page.addScriptTag({ content: result.outputFiles[0].text });

  const state = page.getByLabel('State/Region', { exact: true }).first();
  await state.waitFor();

  const formData = () =>
    page.locator('form').evaluate((form) => [...new FormData(form)]);

  assert.deepEqual(await formData(), [['nrc', '12/LaMaNa(N)001234']]);

  await page.getByRole('button', { name: 'Language' }).click();

  const number = page.getByLabel('ဂဏန်းခြောက်လုံး').first();

  assert.equal(await number.inputValue(), '၀၀၁၂၃၄');
  assert.deepEqual(await formData(), [['nrc', '၁၂/လမန(နိုင်)၀၀၁၂၃၄']]);

  const stateMm = page.getByLabel('ပြည်နယ်/တိုင်း').first();
  await stateMm.focus();
  await page.keyboard.press('Tab');

  assert.equal(
    await page
      .getByLabel('မြို့နယ်')
      .first()
      .evaluate((el) => el === document.activeElement),
    true,
  );

  await stateMm.selectOption('1');

  assert.equal(await page.getByLabel('မြို့နယ်').first().inputValue(), '');
  assert.deepEqual(await formData(), [['nrc', '']]);
  assert.equal(
    await page.locator('form').evaluate((f) => f.checkValidity()),
    false,
  );

  await page.getByLabel('မြို့နယ်').first().selectOption('MaKaNa');
  await number.fill('၀0၁၂၃၄');

  assert.equal(await number.inputValue(), '၀၀၁၂၃၄');
  assert.equal(
    await page.locator('form').evaluate((f) => f.checkValidity()),
    true,
  );

  await page.getByLabel('နိုင်ငံသားအမျိုးအစား').first().selectOption('E');
  assert.deepEqual(await formData(), [['nrc', '၁/မကန(ဧည့်)၀၀၁၂၃၄']]);
  await page.getByLabel('နိုင်ငံသားအမျိုးအစား').first().selectOption('M');
  assert.deepEqual(await formData(), [['nrc', '၁/မကန(သ)၀၀၁၂၃၄']]);

  await stateMm.selectOption('9');
  assert.equal(await stateMm.locator('option[value="9"]').count(), 1);
  assert.equal(
    await stateMm.locator('option[value="9"]').textContent(),
    'နေပြည်တော် / မန္တလေးတိုင်း',
  );
  await page.getByLabel('မြို့နယ်').first().selectOption('UTaTha');
  assert.deepEqual(await formData(), [['nrc', '၉/ဥတသ(သ)၀၀၁၂၃၄']]);

  await page.getByRole('button', { name: 'Clear' }).click();

  assert.equal(await number.inputValue(), '');
  assert.equal(await stateMm.inputValue(), '');

  const html = renderToString(
    React.createElement(NrcSelector, { defaultValue: '၁၂/လမန(နိုင်)၀၀၁၂၃၄' }),
  );
  await page.setContent('<div id="app" data-hydrate="true">' + html + '</div>');

  const ids = await page
    .locator('[id]')
    .evaluateAll((elements) => elements.map((el) => el.id));
  await page.addScriptTag({ content: result.outputFiles[0].text });

  assert.deepEqual(
    await page
      .locator('[id]')
      .evaluateAll((elements) => elements.map((el) => el.id)),
    ids,
  );
  assert.equal(await page.getByRole('textbox').inputValue(), '၀၀၁၂၃၄');

  await page.setContent('<div id="app" data-configured="true"></div>');
  await page.addScriptTag({ content: result.outputFiles[0].text });
  await page.getByLabel('State/Region', { exact: true }).waitFor();

  assert.deepEqual(await formData(), [['nrc', '12/TestCode(P)001234']]);

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByLabel('ပြည်နယ်/တိုင်း').selectOption('99');

  assert.equal(await page.getByLabel('မြို့နယ်').inputValue(), 'TestCode');
  assert.equal(await page.getByLabel('ဂဏန်းခြောက်လုံး').inputValue(), '၀၀၁၂၃၄');
  assert.deepEqual(await formData(), [['nrc', '၉၉/ကခဂ(ပြု)၀၀၁၂၃၄']]);
  assert.equal(
    await page.locator('form').evaluate((form) => form.checkValidity()),
    true,
  );

  await page.getByRole('button', { name: 'Reset' }).click();

  assert.deepEqual(await formData(), [['nrc', '၁၂/ကခဂ(ပြု)၀၀၁၂၃၄']]);

  await page.getByLabel('ပြည်နယ်/တိုင်း').selectOption('1');

  assert.deepEqual(await formData(), [['nrc', '']]);
  assert.equal(
    await page.locator('form').evaluate((form) => form.checkValidity()),
    false,
  );
  assert.deepEqual(failures, []);

  console.log(
    `Chromium ${browser.version()}: form submission, localization, keyboard, partial input, controlled reset, SSR hydration and configured reference data passed`,
  );
} finally {
  await browser.close();
}
