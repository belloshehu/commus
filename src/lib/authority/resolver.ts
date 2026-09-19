import { AuthorityDestination, AuthorityType } from './types';

const registeredDestinations: AuthorityDestination[] = [
  {
    authorityId: 'auth_downtown_central',
    name: 'Downtown Emergency Services Dispatch Center',
    type: 'GENERAL_DISPATCH',
    endpoint: 'https://mock.authority-gateway.local/v1/downtown',
    geohashPrefix: 'dr5ru',
    channel: 'MOCK',
    contactEmail: 'dispatch.central@authority-safety.gov',
    contactPhone: '+1-800-555-0199',
  },
  {
    authorityId: 'auth_north_transit',
    name: 'North Metro Transit Safety Division',
    type: 'TRAFFIC',
    endpoint: 'https://mock.authority-gateway.local/v1/north-transit',
    geohashPrefix: 'dr5rv',
    channel: 'MOCK',
    contactEmail: 'transit.safety@authority-safety.gov',
    contactPhone: '+1-800-555-0122',
  },
  {
    authorityId: 'auth_westside_patrol',
    name: 'Westside Community Police Command',
    type: 'POLICE',
    endpoint: 'https://mock.authority-gateway.local/v1/westside',
    geohashPrefix: 'dr5rt',
    channel: 'MOCK',
    contactEmail: 'westside.command@authority-safety.gov',
    contactPhone: '+1-800-555-0144',
  },
];

const defaultFallbackDestination: AuthorityDestination = {
  authorityId: 'auth_national_safety_gateway',
  name: 'Central Emergency Escalation Gateway',
  type: 'GENERAL_DISPATCH',
  endpoint: 'https://mock.authority-gateway.local/v1/national',
  geohashPrefix: 'dr5',
  channel: 'MOCK',
  contactEmail: 'emergency.escalation@authority-safety.gov',
  contactPhone: '+1-800-555-0100',
};

/**
 * Determines the relevant geographic authority destination based on
 * location coordinates, geohash grid prefix, or incident category.
 */
export function resolveAuthorityDestination(
  lat: number,
  lng: number,
  geohash?: string,
  category?: string
): AuthorityDestination {
  if (geohash) {
    const match = registeredDestinations.find((d) => geohash.startsWith(d.geohashPrefix));
    if (match) return match;
  }

  // Round coordinates to ~1.1km grid prefix matching
  const roundedLat = Math.round(lat * 10) / 10;
  const roundedLng = Math.round(lng * 10) / 10;

  if (roundedLat === 40.7 && roundedLng === -74.0) {
    return registeredDestinations[0]; // Downtown
  } else if (roundedLat === 40.7 && roundedLng === -74.1) {
    return registeredDestinations[1]; // North Transit
  }

  return defaultFallbackDestination;
}
