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
