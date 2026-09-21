import { NextRequest, NextResponse } from 'next/server';

export interface IncidentTranslationRequest {
  incidentId?: string;
  title: string;
  description: string;
  category?: string;
  dangerLevel?: string;
  status?: string;
  targetLanguage: 'english' | 'arabic' | 'portuguese' | 'portegues' | 'french' | 'swahili' | 'yoruba' | 'hausa' | 'igbo' | string;
}

export interface IncidentTranslationResponse {
  success: boolean;
  targetLanguage: string;
  translated: {
    title: string;
    description: string;
    categoryLabel?: string;
    dangerLevelLabel?: string;
    statusLabel?: string;
    safetyNotice?: string;
  };
  provider: 'gemini' | 'fallback';
}

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'English',
  arabic: 'Arabic',
  french: 'French',
  portuguese: 'Portuguese',
  portegues: 'Portuguese',
  hausa: 'Hausa',
  yoruba: 'Yoruba',
  swahili: 'Swahili',
  igbo: 'Igbo',
};

export async function POST(req: NextRequest) {
  try {
    const body: IncidentTranslationRequest = await req.json().catch(() => ({}));
    const {
      title = '',
      description = '',
      category = 'INCIDENT',
      dangerLevel = 'MEDIUM',
      status = 'VERIFIED',
      targetLanguage = 'english',
    } = body;

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
You are an expert emergency crisis communication translator.
Translate the following emergency community safety incident report into ${langDisplayName} (${normalizedLang}).
Ensure the incident details, danger warnings, and situational instructions remain accurate, respectful, and clear for citizens and responders.

Original Incident Details:
- Title: "${title}"
- Description: "${description}"
- Category: "${category}"
- Danger Level: "${dangerLevel}"
- Verification Status: "${status}"

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Translated incident title",
  "description": "Translated detailed description",
  "categoryLabel": "Translated category label",
  "dangerLevelLabel": "Translated danger level label",
  "statusLabel": "Translated verification status label",
  "safetyNotice": "A concise 1-sentence situational safety precaution in ${langDisplayName}"
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
                description: parsed.description || description,
                categoryLabel: parsed.categoryLabel || category,
                dangerLevelLabel: parsed.dangerLevelLabel || dangerLevel,
                statusLabel: parsed.statusLabel || status,
                safetyNotice: parsed.safetyNotice || 'Stay alert and avoid the affected area if possible.',
              },
              provider: 'gemini',
            } satisfies IncidentTranslationResponse);
          }
        }
      } catch (err) {
        console.warn('[Translate Incident] Gemini API call failed, falling back:', err);
      }
    }

    // Intelligent Fallback translation generator for dev/offline mode
    const fallbackTranslated = generateFallbackTranslation(
      normalizedLang,
      title,
      description,
      category,
      dangerLevel,
      status
    );

    return NextResponse.json({
      success: true,
      targetLanguage: normalizedLang,
      translated: fallbackTranslated,
      provider: 'fallback',
    } satisfies IncidentTranslationResponse);

  } catch (error: any) {
    console.error('[Translate Incident API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to translate incident report' },
      { status: 500 }
    );
  }
}

function generateFallbackTranslation(
  lang: string,
  title: string,
  description: string,
  category: string,
  dangerLevel: string,
  status: string
) {
  const metaLookup: Record<string, { prefix: string; notice: string; dangerLabel: string }> = {
    arabic: {
      prefix: '[تقرير مترجم] ',
      notice: 'تنبيه طوارئ: يرجى توخي الحذر والابتعاد عن المنطقة المتأثرة.',
      dangerLabel: dangerLevel === 'HIGH' ? 'مستوى الخطر: مرتفع' : 'مستوى الخطر: متوسط',
    },
    french: {
      prefix: '[Rapport Traduit] ',
      notice: "Alerte d'urgence : Veuillez rester vigilant et éviter la zone touchée.",
      dangerLabel: dangerLevel === 'HIGH' ? 'Danger Élevé' : 'Danger Modéré',
    },
    portuguese: {
      prefix: '[Relatório Traduzido] ',
      notice: 'Alerta de emergência: Fique atento e evite a área afetada se possível.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Nível de Perigo: Alto' : 'Nível de Perigo: Médio',
    },
    portegues: {
      prefix: '[Relatório Traduzido] ',
      notice: 'Alerta de emergência: Fique atento e evite a área afetada se possível.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Nível de Perigo: Alto' : 'Nível de Perigo: Médio',
    },
    hausa: {
      prefix: '[Rahoton Hausa] ',
      notice: 'Gargadin gaggawa: Ku kiyaye tare da nisantar yankin da lamarin ya shafa.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Babban Hatsari' : 'Matsakaicin Hatsari',
    },
    yoruba: {
      prefix: '[Iroyin Yoruba] ',
      notice: 'Ikilọ pajawiri: Jọwọ ṣọra ki o yago fun agbegbe ti iṣẹlẹ yii kan.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Ewu Giga' : 'Ewu Iwọntunwọnsi',
    },
    swahili: {
      prefix: '[Ripoti ya Kiswahili] ',
      notice: 'Tahadhari ya dharura: Tafadhali kuwa mwangalifu na epuka eneo lililoathiriwa.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Hatari Kubwa' : 'Hatari ya Wastani',
    },
    igbo: {
      prefix: '[Akụkọ Igbo] ',
      notice: 'Ịdọ aka ná ntị mberede: Biko mụrụ anya ma zere mpaghara ihe a mere.',
      dangerLabel: dangerLevel === 'HIGH' ? 'Ihe Ize Ndụ Dị Elu' : 'Ihe Ize Ndụ Na-adịchaghị Elu',
    },
    english: {
      prefix: '',
      notice: 'Safety Alert: Please stay cautious and avoid the affected area if possible.',
      dangerLabel: `Danger Level: ${dangerLevel}`,
    },
  };

  const meta = metaLookup[lang] || {
    prefix: `[${lang.toUpperCase()}] `,
    notice: 'Emergency report translated for community awareness.',
    dangerLabel: `Danger Level: ${dangerLevel}`,
  };

  if (lang === 'english') {
    return {
      title,
      description,
      categoryLabel: category,
      dangerLevelLabel: `Danger Level: ${dangerLevel}`,
      statusLabel: status,
      safetyNotice: meta.notice,
    };
  }

  return {
    title: `${meta.prefix}${title}`,
    description: `${description}\n\n*${meta.notice}*`,
    categoryLabel: category,
    dangerLevelLabel: meta.dangerLabel,
    statusLabel: status,
    safetyNotice: meta.notice,
  };
}
