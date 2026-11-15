import React, { useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { NrcSelector } from '../src/react';
import { customNrc } from './additional-data';

function ConfiguredDemo() {
  const [language, setLanguage] = useState<'en' | 'mm'>('en');

  return (
    <form>
      <NrcSelector
        nrc={customNrc}
        defaultValue="12/TestCode(P)001234"
        language={language}
        required
      />
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
      >
        Language
      </button>
      <button type="reset">Reset</button>
    </form>
  );
}

function Demo() {
  const [value, setValue] = useState('12/LaMaNa(N)001234');
  const [language, setLanguage] = useState<'en' | 'mm'>('en');

  return (
    <form>
      <NrcSelector
        value={value}
        onChange={setValue}
        language={language}
        required
      />
      <NrcSelector name="other" defaultValue="၁၂/လမန(နိုင်)၀၀၁၂၃၄" disabled />
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
      >
        Language
      </button>
      <button type="button" onClick={() => setValue('')}>
        Clear
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}

const root = document.getElementById('app')!;

if (root.dataset.hydrate)
  hydrateRoot(root, <NrcSelector defaultValue="၁၂/လမန(နိုင်)၀၀၁၂၃၄" />);
else if (root.dataset.configured) createRoot(root).render(<ConfiguredDemo />);
else createRoot(root).render(<Demo />);
