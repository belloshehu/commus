import { describe, it, expect } from 'vitest';
import { SUPPORTED_TRANSLATION_LANGUAGES } from '../src/components/incident/IncidentTranslateModal';
import { POST } from '../src/app/api/ai/translate-incident/route';
import { NextRequest } from 'next/server';

describe('Incident Report Detail TTS & Translation Suite', () => {
  it('supports all 8 required languages in incident translation modal', () => {
    const languageIds = SUPPORTED_TRANSLATION_LANGUAGES.map((l) => l.id);
    expect(languageIds).toContain('english');
    expect(languageIds).toContain('arabic');
    expect(languageIds).toContain('portuguese');
    expect(languageIds).toContain('french');
    expect(languageIds).toContain('swahili');
    expect(languageIds).toContain('yoruba');
    expect(languageIds).toContain('hausa');
    expect(languageIds).toContain('igbo');
    expect(languageIds.length).toBe(8);
  });

  it('correctly sets RTL text direction for Arabic and LTR for others', () => {
    const arabic = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.id === 'arabic');
    expect(arabic?.dir).toBe('rtl');

    const others = SUPPORTED_TRANSLATION_LANGUAGES.filter((l) => l.id !== 'arabic');
    others.forEach((lang) => {
      expect(lang.dir).toBe('ltr');
    });
  });

  it('translates an incident report into all 8 languages via API', async () => {
    const sampleIncident = {
      title: 'Gas Cylinder Leak Near Market Entrance',
      description: 'Strong smell of propane gas observed near the south market entrance. Public warned to stay clear and avoid open flames.',
      category: 'HAZARD',
      dangerLevel: 'HIGH',
      status: 'VERIFIED',
    };

    const targetLanguages = [
      'english',
      'arabic',
      'portuguese',
      'portegues',
      'french',
      'swahili',
      'yoruba',
      'hausa',
      'igbo',
    ];

    for (const lang of targetLanguages) {
      const req = new NextRequest('http://localhost:3000/api/ai/translate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sampleIncident,
          targetLanguage: lang,
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.targetLanguage).toBe(lang);
      expect(data.translated.title).toBeTruthy();
      expect(data.translated.description).toBeTruthy();
      expect(data.translated.dangerLevelLabel).toBeTruthy();
      expect(data.translated.safetyNotice).toBeTruthy();
    }
  });
});
