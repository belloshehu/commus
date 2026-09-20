import { describe, it, expect, beforeEach, vi } from 'vitest';
import { classifyVoiceTranscript } from '../src/lib/voiceCategoryClassifier';
import { NextRequest } from 'next/server';
import { UserSession } from '../src/lib/auth';
import { signSessionToken } from '../src/lib/security';

const dbStore: Record<string, any> = {};

vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: (db: any, path?: string) => path || 'root',
  push: (refObj: string) => {
    const key = `inc_vvoice_${Math.random().toString(36).substring(2, 8)}`;
    return { key };
  },
  get: vi.fn(async (path: string) => {
    const val = dbStore[path];
    return {
      exists: () => val !== undefined && val !== null,
      val: () => val,
    };
  }),
  set: vi.fn(async (path: string, val: any) => {
    dbStore[path] = val;
  }),
  update: vi.fn(async (path: string, val: any) => {
    dbStore[path] = { ...(dbStore[path] || {}), ...val };
  }),
  onValue: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

import { POST as createIncidentHandler } from '../src/app/api/incidents/route';

describe('Voice Command Incident Wizard & Classification Tests', () => {
  const mockUser: UserSession = {
    userId: 'usr_voice_tester',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    isAuthenticated: true,
  };

  let authCookie: string;

  beforeEach(() => {
    for (const key of Object.keys(dbStore)) {
      delete dbStore[key];
    }
    authCookie = `antijj_session=${signSessionToken(mockUser)}`;
  });

  describe('classifyVoiceTranscript Classifier', () => {
    it('classifies traffic hazard speech into TRAFFIC_HAZARD category', () => {
      const result = classifyVoiceTranscript(
        'Severe car collision and traffic congestion blocking two lanes near main road.'
      );
      expect(result.category).toBe('TRAFFIC_HAZARD');
      expect(result.suggestedTitle).toContain('Traffic Hazard');
      expect(result.confidenceScore).toBeGreaterThan(0.4);
    });

    it('classifies power outage speech into INFRASTRUCTURE_FAILURE category', () => {
      const result = classifyVoiceTranscript(
        'Complete power outage and blackout across three streetlights and residential block.'
      );
      expect(result.category).toBe('INFRASTRUCTURE_FAILURE');
      expect(result.suggestedTitle).toContain('Infrastructure Failure');
    });

    it('classifies crowd gathering speech into CROWD_SAFETY_ALERT category', () => {
      const result = classifyVoiceTranscript(
        'Huge crowd gathering and protest bottleneck forming near transit station exit.'
      );
      expect(result.category).toBe('CROWD_SAFETY_ALERT');
      expect(result.suggestedTitle).toContain('Crowd Safety Alert');
    });

    it('classifies fight or commotion speech into DISTURBANCE category', () => {
      const result = classifyVoiceTranscript(
        'Loud shouting fight and brawl breaking out near market entrance.'
      );
      expect(result.category).toBe('DISTURBANCE');
      expect(result.suggestedTitle).toContain('Disturbance');
    });

    it('falls back to EMERGENCY_OTHER for general hazards', () => {
      const result = classifyVoiceTranscript('Smoke and emergency hazard reported near building.');
      expect(result.category).toBe('EMERGENCY_OTHER');
    });

    it('handles empty or blank voice transcript gracefully', () => {
      const result = classifyVoiceTranscript('');
      expect(result.category).toBe('EMERGENCY_OTHER');
      expect(result.suggestedTitle).toBe('Voice Incident Report');
    });
  });

  describe('POST /api/incidents Voice Report Payload Integration', () => {
    it('accepts voice incident payload with voiceNoteUrl and matches standard IncidentRecord schema', async () => {
      const voicePayload = {
        communityId: 'comm_central',
        category: 'TRAFFIC_HAZARD',
        title: 'Traffic Hazard: Car Collision on 5th Ave',
        description: 'Auto-transcribed voice report describing a two-vehicle collision.',
        voiceNoteUrl: 'blob:http://localhost:3000/audio_mock_123',
        dangerLevel: 'HIGH',
        safetyConfirmed: true,
        incidentLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          address: '5th Avenue & Main Street',
        },
        evidence: [
          {
            id: 'ev_voice_1',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a',
            caption: 'Photo of collision debris',
          },
        ],
      };

      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${signSessionToken(mockUser)}`,
          Cookie: authCookie,
        },
        body: JSON.stringify(voicePayload),
      });

      const res = await createIncidentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.incidentId).toBeDefined();

      const savedIncident = dbStore[`incidents/${json.incidentId}`];
      expect(savedIncident).toBeDefined();
      expect(savedIncident.category).toBe('TRAFFIC_HAZARD');
      expect(savedIncident.voiceNoteUrl).toBe('blob:http://localhost:3000/audio_mock_123');
      expect(savedIncident.blurredLocation).toBeDefined();
      expect(savedIncident.evidence.length).toBe(1);
      expect(savedIncident.authenticityStatus).toBe('UNREVIEWED');
    });
  });
});
