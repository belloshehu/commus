import { fuzzLocation, encryptPreciseLocation } from './location';

export interface SyntheticIncident {
  id: string;
  reporterPseudonymId: string;
  communityId: string;
  category: 'TRAFFIC_HAZARD' | 'INFRASTRUCTURE_FAILURE' | 'DISTURBANCE' | 'CROWD_SAFETY_ALERT' | 'EMERGENCY_OTHER';
  title: string;
  description: string;
  blurredLatitude: number;
  blurredLongitude: number;
  encryptedPreciseLocation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'VERIFIED' | 'ESCALATED' | 'RESOLVED';
  createdAt: string;
  isSynthetic: true;
}

const CATEGORIES: SyntheticIncident['category'][] = [
  'TRAFFIC_HAZARD',
  'INFRASTRUCTURE_FAILURE',
  'DISTURBANCE',
  'CROWD_SAFETY_ALERT',
  'EMERGENCY_OTHER'
];

const SEVERITIES: SyntheticIncident['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * MANDATE: Development and testing MUST use synthetic test data.
 * Generates privacy-compliant synthetic incident records.
 */
export function generateSyntheticIncidents(count: number = 5): SyntheticIncident[] {
  const incidents: SyntheticIncident[] = [];
  const baseLat = 24.7136; // Synthetic center (Riyadh region coordinates)
  const baseLng = 46.6753;

  for (let i = 1; i <= count; i++) {
    const rawLat = baseLat + (Math.random() - 0.5) * 0.05;
    const rawLng = baseLng + (Math.random() - 0.5) * 0.05;
    const fuzzed = fuzzLocation(rawLat, rawLng);

    incidents.push({
      id: `syn_inc_${1000 + i}`,
      reporterPseudonymId: `pseudo_syn_user_${i % 3}`,
      communityId: `comm_central_district`,
      category: CATEGORIES[i % CATEGORIES.length],
      title: `Synthetic Alert #${i}: ${CATEGORIES[i % CATEGORIES.length]}`,
      description: `Synthetic test description for incident #${i}. All coordinates blurred.`,
      blurredLatitude: fuzzed.blurredLatitude,
      blurredLongitude: fuzzed.blurredLongitude,
      encryptedPreciseLocation: encryptPreciseLocation(rawLat, rawLng, `Synthetic St #${i}`),
      severity: SEVERITIES[i % SEVERITIES.length],
      status: 'SUBMITTED',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      isSynthetic: true
    });
  }

  return incidents;
}
