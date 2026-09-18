import { describe, it, expect, vi } from 'vitest';
import { canSubmitIncident, UserSession } from '../src/lib/auth';
import { fuzzLocation, encryptPreciseLocation, decryptPreciseLocation } from '../src/lib/location';

// Mock Firebase client module to prevent actual network calls during unit tests
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  push: vi.fn(() => ({ key: 'mock_incident_123' })),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  onValue: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

import { POST } from '../src/app/api/incidents/route';
import { NextRequest } from 'next/server';

describe('Antijj Multi-Step Incident Reporting Workflow', () => {
  const citizenSession: UserSession = {
    userId: 'user_test_citizen_99',
    pseudonymId: 'pseudo_citizen99',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    isAuthenticated: true,
  };

  const anonymousSession: UserSession = {
    role: 'ANONYMOUS',
    isAuthenticated: false,
  };

  describe('Authorization Rules', () => {
    it('allows verified citizen members to submit incidents', () => {
      expect(canSubmitIncident(citizenSession)).toBe(true);
    });

    it('strictly blocks anonymous users from submitting incidents', () => {
      expect(canSubmitIncident(anonymousSession)).toBe(false);
    });
  });

  describe('Location Fuzzing & Encryption Primitives', () => {
    it('applies ~1.1km grid blur to exact coordinates', () => {
      const preciseLat = 40.712891;
      const preciseLng = -74.006012;

      const fuzzed = fuzzLocation(preciseLat, preciseLng);
      expect(fuzzed.blurredLatitude).toBe(40.71);
      expect(fuzzed.blurredLongitude).toBe(-74.01);
      expect(fuzzed.precisionRadiusKm).toBeGreaterThanOrEqual(1.0);
    });

    it('encrypts precise location data using AES-256-GCM and decrypts successfully', () => {
      const lat = 40.7128;
      const lng = -74.006;
      const exactAddress = '123 Main Street, Suite 400';

      const encryptedPayload = encryptPreciseLocation(lat, lng, exactAddress);
      expect(encryptedPayload).toContain('ciphertext');
      expect(encryptedPayload).toContain('authTag');

      const decrypted = decryptPreciseLocation(encryptedPayload);
      expect(decrypted.lat).toBe(lat);
      expect(decrypted.lng).toBe(lng);
      expect(decrypted.exactAddress).toBe(exactAddress);
    });
  });

  describe('API Route Validation (/api/incidents)', () => {
    it('rejects submissions from unauthenticated / anonymous users with 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          session: anonymousSession,
          title: 'Road Blockade',
          description: 'Obstacle blocking traffic flow',
          dangerLevel: 'MEDIUM',
          safetyConfirmed: true,
          incidentLocation: { latitude: 40.71, longitude: -74.0 },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects submissions with missing or short title with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          session: citizenSession,
          title: 'Hi', // Less than 3 chars
          description: 'Valid long description of the safety event',
          dangerLevel: 'LOW',
          safetyConfirmed: true,
          incidentLocation: { latitude: 40.71, longitude: -74.0 },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_FAILED');
      expect(data.details).toContain('Title must be at least 3 characters long.');
    });

    it('rejects submissions without mandatory safety confirmation with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          session: citizenSession,
          title: 'Traffic Bottleneck',
          description: 'Severe traffic congestion near central station plaza',
          dangerLevel: 'MEDIUM',
          safetyConfirmed: false, // Mandatory confirmation missing
          incidentLocation: { latitude: 40.71, longitude: -74.0 },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_FAILED');
      expect(data.details).toContain(
        'Safety confirmation acknowledgment is mandatory prior to report submission.'
      );
    });

    it('accepts valid incident report payloads and returns incidentId with fuzzed location', async () => {
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          session: citizenSession,
          communityId: 'comm_central',
          category: 'CROWD_SAFETY_ALERT',
          title: 'Crowd Bottleneck Near Main Transit Exit',
          description: 'Gathering crowd causing physical bottleneck at north transit gates.',
          dangerLevel: 'HIGH',
          safetyConfirmed: true,
          incidentLocation: {
            address: 'North Transit Gate 4',
            landmark: 'Metro Plaza',
            latitude: 40.71289,
            longitude: -74.006,
          },
          evidence: [
            {
              id: 'ev_101',
              url: 'mock_preview_url',
              type: 'image',
              name: 'gate_crowd.jpg',
              size: 2048500,
              uploadedAt: Date.now(),
            },
          ],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.incidentId).toBeDefined();
      expect(data.blurredLocation.latitude).toBe(40.71);
      expect(data.blurredLocation.longitude).toBe(-74.01);
    });
  });
});
