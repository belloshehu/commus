import { NextRequest, NextResponse } from 'next/server';
import { classifyVoiceTranscript } from '@/lib/voiceCategoryClassifier';
import { IncidentCategory } from '@/lib/firebase/rtdb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { audioBase64, mimeType = 'audio/webm', liveTranscript = '' } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    let aiTranscript = liveTranscript;
    let aiTitle = '';
    let aiDescription = '';
    let aiCategory: IncidentCategory = 'EMERGENCY_OTHER';
    let aiDangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    // 1. Try Gemini API Multimodal Audio Processing if API Key is available
    if (apiKey && (audioBase64 || liveTranscript)) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const promptText = `
You are an expert emergency safety response AI assistant.
Analyze the user's spoken voice recording (or live speech transcript) and extract structured safety incident details.

Return ONLY a valid JSON object matching this exact schema:
{
  "transcript": "Exact full transcription of the spoken audio",
  "title": "Concise 3-7 word title summarizing the safety incident/hazard",
  "description": "Clear detailed description of what occurred, hazard location, and urgency",
  "category": "One of: TRAFFIC_HAZARD | INFRASTRUCTURE_FAILURE | DISTURBANCE | CROWD_SAFETY_ALERT | EMERGENCY_OTHER",
  "dangerLevel": "One of: LOW | MEDIUM | HIGH"
}
`;

        const contentsParts: any[] = [{ text: promptText }];

        if (audioBase64) {
          const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
          contentsParts.push({
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          });
        } else if (liveTranscript) {
          contentsParts.push({ text: `Spoken live transcript: "${liveTranscript}"` });
        }

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: contentsParts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.transcript) aiTranscript = parsed.transcript;
            if (parsed.title) aiTitle = parsed.title;
            if (parsed.description) aiDescription = parsed.description;
            if (parsed.category && ['TRAFFIC_HAZARD', 'INFRASTRUCTURE_FAILURE', 'DISTURBANCE', 'CROWD_SAFETY_ALERT', 'EMERGENCY_OTHER'].includes(parsed.category)) {
              aiCategory = parsed.category;
            }
            if (parsed.dangerLevel && ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.dangerLevel)) {
              aiDangerLevel = parsed.dangerLevel;
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('[transcribe-voice] Gemini API call skipped or fallback:', geminiErr.message);
      }
    }

    // 2. Fallback Heuristic Classifier if AI title/description were not generated
    if (!aiTitle || !aiDescription) {
      const fallbackText = aiTranscript || liveTranscript || 'Voice recording submitted by community member.';
      const fallbackResult = classifyVoiceTranscript(fallbackText);

      aiTranscript = fallbackResult.transcriptDescription;
      aiTitle = fallbackResult.suggestedTitle;
      aiDescription = fallbackResult.transcriptDescription;
      aiCategory = fallbackResult.category;
      if (fallbackResult.category === 'EMERGENCY_OTHER' || fallbackResult.category === 'DISTURBANCE') {
        aiDangerLevel = 'HIGH';
      } else if (fallbackResult.category === 'TRAFFIC_HAZARD') {
        aiDangerLevel = 'MEDIUM';
      } else {
        aiDangerLevel = 'LOW';
      }
    }

    return NextResponse.json({
      success: true,
      transcript: aiTranscript,
      title: aiTitle,
      description: aiDescription,
      category: aiCategory,
      dangerLevel: aiDangerLevel,
    });
  } catch (error: any) {
    console.error('[API /api/ai/transcribe-voice] Error:', error);
    const fallbackResult = classifyVoiceTranscript('Voice recording emergency report');
    return NextResponse.json({
      success: true,
      transcript: fallbackResult.transcriptDescription,
      title: fallbackResult.suggestedTitle,
      description: fallbackResult.transcriptDescription,
      category: fallbackResult.category,
      dangerLevel: 'MEDIUM',
    });
  }
}
