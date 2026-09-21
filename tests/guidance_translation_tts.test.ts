import { describe, it, expect } from 'vitest';
import { SUPPORTED_TRANSLATION_LANGUAGES } from '../src/components/guidance/GuidanceTranslateModal';

describe('Safety Guidance TTS & Gemini AI Translation Suite', () => {
  it('supports all 8 required languages in translation modal metadata', () => {
    const languageIds = SUPPORTED_TRANSLATION_LANGUAGES.map((l) => l.id);
    expect(languageIds).toContain('english');
    expect(languageIds).toContain('arabic');
    expect(languageIds).toContain('french');
    expect(languageIds).toContain('portuguese');
    expect(languageIds).toContain('hausa');
    expect(languageIds).toContain('yoruba');
    expect(languageIds).toContain('swahili');
    expect(languageIds).toContain('igbo');
    expect(languageIds.length).toBe(8);
  });

  it('correctly sets RTL text direction for Arabic and LTR for all other languages', () => {
    const arabic = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.id === 'arabic');
    expect(arabic?.dir).toBe('rtl');

    const others = SUPPORTED_TRANSLATION_LANGUAGES.filter((l) => l.id !== 'arabic');
    others.forEach((lang) => {
      expect(lang.dir).toBe('ltr');
    });
  });

  it('validates each language has a valid flag emoji and native display name', () => {
    SUPPORTED_TRANSLATION_LANGUAGES.forEach((lang) => {
      expect(lang.flag).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
    });
  });
});
