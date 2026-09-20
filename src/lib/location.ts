import crypto from 'crypto';

export interface FuzzedLocation {
  blurredLatitude: number;
  blurredLongitude: number;
  precisionRadiusKm: number;
}

/**
 * Fuzzes precise coordinates to prevent exposing exact reporter/incident location.
 * Rounding coordinates to 2 decimal places provides ~1.1km grid blur.
 */
export function fuzzLocation(lat: number, lng: number): FuzzedLocation {
  // Truncate/round to 2 decimal places (~1.1km - 1.5km precision blur)
  const blurredLatitude = Math.round(lat * 100) / 100;
  const blurredLongitude = Math.round(lng * 100) / 100;

  return {
    blurredLatitude,
    blurredLongitude,
    precisionRadiusKm: 1.2
  };
}

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts precise location data before storing in database.
 * Only readable by authorized emergency dispatchers during escalation.
 */
export function encryptPreciseLocation(
  lat: number,
  lng: number,
  exactAddress?: string,
  secretKeyHex: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(secretKeyHex, 'hex');
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const payload = JSON.stringify({ lat, lng, exactAddress, timestamp: Date.now() });
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    ciphertext: encrypted
  });
}

/**
 * Decrypts precise location data.
 * Requires AUTHORITY_DISPATCHER role authorization check prior to execution.
 */
export function decryptPreciseLocation(
  encryptedPayloadJson: string,
  secretKeyHex: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
): { lat: number; lng: number; exactAddress?: string; timestamp: number } {
  const { iv, authTag, ciphertext } = JSON.parse(encryptedPayloadJson);
  const key = Buffer.from(secretKeyHex, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

export interface ResolvedLocationDetails {
  locationName: string;
  state: string;
  country: string;
  formattedLocation: string;
}

/**
 * Resolves or extracts structured locationName, state, and country from coordinates/address.
 */
export function resolveLocationDetails(
  lat: number,
  lng: number,
  address?: string,
  providedLocationName?: string,
  providedState?: string,
  providedCountry?: string
): ResolvedLocationDetails {
  let locationName = providedLocationName || '';
  let state = providedState || '';
  let country = providedCountry || '';

  // Parse comma-separated address if provided (e.g. "Ikeja Central, Lagos State, Nigeria")
  if (address && (!locationName || !state || !country)) {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      if (!locationName) locationName = parts[0];
      if (!state) state = parts[1];
      if (!country) country = parts[2];
    } else if (parts.length === 2) {
      if (!locationName) locationName = parts[0];
      if (!state) state = parts[1];
    } else if (parts.length === 1 && !locationName) {
      locationName = parts[0];
    }
  }

  // Region lookup fallback based on lat/lng coordinate bounding boxes
  if (!country) {
    if (lat >= 4.0 && lat <= 14.0 && lng >= 2.5 && lng <= 14.5) {
      country = 'Nigeria';
      if (!state) {
        if (lat >= 6.3 && lat <= 6.7 && lng >= 3.1 && lng <= 3.6) state = 'Lagos State';
        else if (lat >= 8.9 && lat <= 9.3 && lng >= 7.3 && lng <= 7.6) state = 'Abuja FCT';
        else if (lat >= 11.9 && lat <= 12.1 && lng >= 8.4 && lng <= 8.6) state = 'Kano State';
        else if (lat >= 7.3 && lat <= 7.5 && lng >= 3.8 && lng <= 4.0) state = 'Oyo State';
        else if (lat >= 4.7 && lat <= 5.0 && lng >= 6.9 && lng <= 7.1) state = 'Rivers State';
        else state = 'Central Zone';
      }
    } else if (lat >= -4.8 && lat <= 5.0 && lng >= 33.8 && lng <= 41.9) {
      country = 'Kenya';
      if (!state) state = 'Nairobi County';
    } else if (lat >= 49.0 && lat <= 61.0 && lng >= -8.0 && lng <= 2.0) {
      country = 'United Kingdom';
      if (!state) state = 'Greater London';
    } else if (lat >= 24.0 && lat <= 49.0 && lng >= -125.0 && lng <= -66.0) {
      country = 'United States';
      if (!state) state = 'New York';
    } else {
      country = 'Global Zone';
      if (!state) state = 'Safety Sector';
    }
  }

  if (!state) state = 'Regional Zone';
  if (!locationName) locationName = address || 'District Sector';

  const formattedLocation = `${locationName}, ${state}, ${country}`;

  return {
    locationName,
    state,
    country,
    formattedLocation,
  };
}

