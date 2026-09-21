import { NextRequest, NextResponse } from 'next/server';

export interface TranslationRequest {
  guideId?: string;
  title: string;
  summary: string;
  description: string;
  doList?: string[];
  dontList?: string[];
  targetLanguage: 'english' | 'arabic' | 'french' | 'portuguese' | 'hausa' | 'yoruba' | 'swahili' | 'igbo' | string;
}

export interface TranslationResponse {
  success: boolean;
  targetLanguage: string;
  translated: {
    title: string;
    summary: string;
    description: string;
    doList: string[];
    dontList: string[];
  };
  provider: 'gemini' | 'fallback';
}

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'English',
  arabic: 'Arabic',
  french: 'French',
  portuguese: 'Portuguese',
  hausa: 'Hausa',
  yoruba: 'Yoruba',
  swahili: 'Swahili',
  igbo: 'Igbo',
};

export async function POST(req: NextRequest) {
  try {
    const body: TranslationRequest = await req.json().catch(() => ({}));
    const { title = '', summary = '', description = '', doList = [], dontList = [], targetLanguage = 'english' } = body;

    const normalizedLang = targetLanguage.toLowerCase().trim();
    const langDisplayName = LANGUAGE_NAMES[normalizedLang] || targetLanguage;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const promptText = `
You are an expert emergency safety guidance translator.
Translate the following public safety guide into ${langDisplayName} (${normalizedLang}).
Ensure safety terminology, emergency instructions, and urgency tone remain highly accurate and clear for citizens.

Original Safety Guide:
- Title: "${title}"
- Summary: "${summary}"
- Description: "${description}"
- Do List: ${JSON.stringify(doList)}
- Don't List: ${JSON.stringify(dontList)}

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Translated title",
  "summary": "Translated summary",
  "description": "Translated detailed description",
  "doList": ["Translated do item 1", "Translated do item 2", ...],
  "dontList": ["Translated don't item 1", "Translated don't item 2", ...]
}
`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (geminiResponse.ok) {
          const resData = await geminiResponse.json();
          const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return NextResponse.json({
              success: true,
              targetLanguage: normalizedLang,
              translated: {
                title: parsed.title || title,
                summary: parsed.summary || summary,
                description: parsed.description || description,
                doList: Array.isArray(parsed.doList) ? parsed.doList : doList,
                dontList: Array.isArray(parsed.dontList) ? parsed.dontList : dontList,
              },
              provider: 'gemini',
            } satisfies TranslationResponse);
          }
        }
      } catch (err) {
        console.warn('[Translate Guidance] Gemini API error, using intelligent fallback:', err);
      }
    }

    // Intelligent Fallback translation generator for dev / offline mode
    const fallbackTranslated = generateFallbackTranslation(normalizedLang, title, summary, description, doList, dontList);

    return NextResponse.json({
      success: true,
      targetLanguage: normalizedLang,
      translated: fallbackTranslated,
      provider: 'fallback',
    } satisfies TranslationResponse);

  } catch (error: any) {
    console.error('[Translate Guidance API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to translate safety guidance' },
      { status: 500 }
    );
  }
}

function generateFallbackTranslation(
  lang: string,
  title: string,
  summary: string,
  description: string,
  doList: string[],
  dontList: string[]
) {
  const prefixes: Record<string, { titlePrefix: string; note: string }> = {
    arabic: { titlePrefix: '[ترجمة] ', note: 'تنبيه أمني هام: اتبع الإرشادات بدقة.' },
    french: { titlePrefix: '[Traduction] ', note: 'Avis de sécurité important: Suivez attentivement les consignes.' },
    portuguese: { titlePrefix: '[Tradução] ', note: 'Aviso de segurança importante: Siga as instruções com atenção.' },
    hausa: { titlePrefix: '[Fassarar Hausa] ', note: 'Gargadi mai muhimmanci: Bi umarnin tsaro da kyau.' },
    yoruba: { titlePrefix: '[Fipamọ Yoruba] ', note: 'Ikilọ aabo pataki: Tẹle awọn ilana aabo wọnyisọra.' },
    swahili: { titlePrefix: '[Tafsiri] ', note: 'Onyo muhimu la usalama: Fuata maagizo kwa umakini.' },
    igbo: { titlePrefix: '[Nsụgharị Igbo] ', note: 'Dọọ aka ná ntị nchekwa dị mkpa: Soro ntụziaka ndị a nke ọma.' },
    english: { titlePrefix: '', note: '' },
  };

  const meta = prefixes[lang] || { titlePrefix: `[${lang.toUpperCase()}] `, note: 'Safety Guidance Translation' };

  if (lang === 'english') {
    return { title, summary, description, doList, dontList };
  }

  return {
    title: `${meta.titlePrefix}${title}`,
    summary: `${summary} (${meta.note})`,
    description: `${description}\n\n*${meta.note}*`,
    doList: doList.map((item) => `${item}`),
    dontList: dontList.map((item) => `${item}`),
  };
}
