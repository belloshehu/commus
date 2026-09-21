import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/transcribe-voice/route';

describe('Gemini AI Live Voice Transcription Endpoint', () => {
  it('handles live transcript text and returns structured classification', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/transcribe-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        liveTranscript:
          'Severe road accident and vehicle collision blocking two lanes on Expressway near central exit gate.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.category).toBe('TRAFFIC_HAZARD');
    expect(data.title).toBeDefined();
    expect(data.description).toBeDefined();
    expect(data.dangerLevel).toBeDefined();
  });

  it('falls back gracefully to heuristic classification when audio payload is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/transcribe-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.title).toBeDefined();
    expect(data.description).toBeDefined();
  });
});
