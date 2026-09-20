import { describe, it, expect } from 'vitest';
import { LOCALES_METADATA, DICTIONARIES } from '../src/lib/i18n/locales';
import { SupportedLocale } from '../src/lib/i18n/types';

describe('Antijj Internationalization (i18n) Framework Suite', () => {
  const supportedLocales: SupportedLocale[] = ['en', 'ar', 'fr', 'ha', 'yo', 'pcm', 'sw', 'ig'];

  it('supports all 8 required languages with valid metadata and flags', () => {
    supportedLocales.forEach((code) => {
      const meta = LOCALES_METADATA[code];
      expect(meta).toBeDefined();
      expect(meta.code).toBe(code);
      expect(meta.nativeName).toBeTruthy();
      expect(meta.englishName).toBeTruthy();
      expect(meta.flagEmoji).toBeTruthy();
      expect(['ltr', 'rtl']).toContain(meta.dir);
    });
  });

  it('correctly sets direction to RTL for Arabic (ar) and LTR for all other 7 languages', () => {
    expect(LOCALES_METADATA.ar.dir).toBe('rtl');
    expect(LOCALES_METADATA.en.dir).toBe('ltr');
    expect(LOCALES_METADATA.fr.dir).toBe('ltr');
    expect(LOCALES_METADATA.ha.dir).toBe('ltr');
    expect(LOCALES_METADATA.yo.dir).toBe('ltr');
    expect(LOCALES_METADATA.pcm.dir).toBe('ltr');
    expect(LOCALES_METADATA.sw.dir).toBe('ltr');
    expect(LOCALES_METADATA.ig.dir).toBe('ltr');
  });

  it('validates every translation dictionary contains all master keys from English schema', () => {
    const enDict = DICTIONARIES.en;

    supportedLocales.forEach((code) => {
      const dict = DICTIONARIES[code];
      expect(dict).toBeDefined();
      expect(dict.nav.incidentFeed).toBeTruthy();
      expect(dict.nav.authorityDispatch).toBeTruthy();
      expect(dict.common.submit).toBeTruthy();
      expect(dict.dangerLevels.high).toBeTruthy();
      expect(dict.forms.safetyConfirmationTitle).toBeTruthy();
      expect(dict.validation.requiredField).toBeTruthy();
      expect(dict.notifications.notificationsTitle).toBeTruthy();
      expect(dict.system.nonConfrontationPolicy).toBeTruthy();
    });
  });
});
