import { describe, it, expect } from 'vitest';
import { fuzzLocation, encryptPreciseLocation, decryptPreciseLocation } from '../src/lib/location';
import { generatePseudonymId, stripExifMetadata } from '../src/lib/privacy';
import { canSubmitIncident, canAccessPreciseLocation, canViewPrivateCommunityIncidents } from '../src/lib/auth';
import { createAuthorityEscalationAuditLog } from '../src/lib/audit';

describe('Antijj Core Privacy & Security Suite', () => {
  it('fuzzes location coordinates to round to ~1.2km blur precision', () => {
    const fuzzed = fuzzLocation(24.7136294, 46.6753194);
    expect(fuzzed.blurredLatitude).toBe(24.71);
    expect(fuzzed.blurredLongitude).toBe(46.68);
    expect(fuzzed.precisionRadiusKm).toBe(1.2);
  });

  it('encrypts and decrypts precise coordinates securely', () => {
    const originalLat = 24.7136294;
    const originalLng = 46.6753194;
    const encrypted = encryptPreciseLocation(originalLat, originalLng, 'Secret HQ St');
    
    expect(encrypted).not.toContain('24.7136294');
    
    const decrypted = decryptPreciseLocation(encrypted);
    expect(decrypted.lat).toBe(originalLat);
    expect(decrypted.lng).toBe(originalLng);
    expect(decrypted.exactAddress).toBe('Secret HQ St');
  });

  it('generates pseudonymous IDs decoupling real user ID from incident', () => {
    const pseudo1 = generatePseudonymId('usr_real_1001', 'comm_central');
    const pseudo2 = generatePseudonymId('usr_real_1001', 'comm_central');
    const pseudoDifferentComm = generatePseudonymId('usr_real_1001', 'comm_north');

    expect(pseudo1).toBe(pseudo2);
    expect(pseudo1).not.toBe('usr_real_1001');
    expect(pseudo1).not.toBe(pseudoDifferentComm);
  });

  it('strips EXIF metadata from uploaded media buffers', () => {
    const dummyBuffer = Buffer.from('fake_image_bytes_with_exif_tags');
    const result = stripExifMetadata(dummyBuffer);
    expect(result.isClean).toBe(true);
    expect(result.removedTagsCount).toBeGreaterThan(0);
  });

  it('enforces that anonymous users CANNOT submit incidents', () => {
    const anonymousSession = { role: 'ANONYMOUS' as const, isAuthenticated: false };
    const memberSession = { role: 'CITIZEN_MEMBER' as const, isAuthenticated: true };

    expect(canSubmitIncident(anonymousSession)).toBe(false);
    expect(canSubmitIncident(memberSession)).toBe(true);
  });

  it('restricts private community incident visibility to authorized community members', () => {
    const sessionCommA = { role: 'CITIZEN_MEMBER' as const, isAuthenticated: true, communityId: 'comm_A' };
    
    expect(canViewPrivateCommunityIncidents(sessionCommA, 'comm_A')).toBe(true);
    expect(canViewPrivateCommunityIncidents(sessionCommA, 'comm_B')).toBe(false);
  });

  it('restricts precise location decryption to authorized dispatcher roles', () => {
    const citizenSession = { role: 'CITIZEN_MEMBER' as const, isAuthenticated: true };
    const dispatcherSession = { role: 'AUTHORITY_DISPATCHER' as const, isAuthenticated: true };

    expect(canAccessPreciseLocation(citizenSession)).toBe(false);
    expect(canAccessPreciseLocation(dispatcherSession)).toBe(true);
  });

  it('creates cryptographically hash-signed audit logs for authority escalations', () => {
    const auditLog = createAuthorityEscalationAuditLog({
      incidentId: 'inc_99',
      actorPseudonymId: 'pseudo_leader_5',
      authorityTarget: 'CIVIL_DEFENSE_DISPATCH',
      reason: 'Infrastructure gas leak threat'
    });

    expect(auditLog.logId).toMatch(/^audit_/);
    expect(auditLog.payloadHash).toHaveLength(64);
    expect(auditLog.digitalSignature).toHaveLength(64);
  });
});
