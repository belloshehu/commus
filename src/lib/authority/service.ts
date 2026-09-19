import { ref, get, set, update } from 'firebase/database';
import { rtdb } from '../firebase/client';
import { UserSession, canAccessPreciseLocation } from '../auth';
import { decryptPreciseLocation } from '../location';
import { createAuthorityEscalationAuditLog } from '../audit';
import {
  AuthorityEscalationRecord,
  AuthorityNotificationProvider,
  AuthorityPayload,
  DeliveryAttemptRecord,
  NotificationResult,
} from './types';
import { resolveAuthorityDestination } from './resolver';
import { MockAuthorityProvider } from './providers/mockProvider';

export class AuthorityNotificationService {
  private static instance: AuthorityNotificationService;
  private provider: AuthorityNotificationProvider;

  private constructor(provider?: AuthorityNotificationProvider) {
    this.provider = provider || new MockAuthorityProvider();
  }

  public static getInstance(provider?: AuthorityNotificationProvider): AuthorityNotificationService {
    if (!AuthorityNotificationService.instance || provider) {
      AuthorityNotificationService.instance = new AuthorityNotificationService(provider);
    }
    return AuthorityNotificationService.instance;
  }

  public setProvider(provider: AuthorityNotificationProvider) {
    this.provider = provider;
  }

  /**
   * Main escalation workflow entrypoint.
   */
  public async escalateIncidentToAuthority(
    session: UserSession,
    incidentId: string,
    reason: string = 'High danger safety alert requiring emergency monitoring'
  ): Promise<AuthorityEscalationRecord> {
    // 1. Authorization check
    const isAuthorizedRole =
      session.isAuthenticated &&
      ['VERIFIED_COMMUNITY_LEADER', 'AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN'].includes(session.role);

    if (!isAuthorizedRole) {
      throw new Error('UNAUTHORIZED: Only verified community leaders, dispatchers, or system admins can trigger authority escalations.');
    }

    // 2. Fetch incident details from RTDB
    const incidentRef = ref(rtdb, `incidents/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (!snapshot.exists()) {
      throw new Error(`NOT_FOUND: Incident ${incidentId} does not exist in RTDB.`);
    }

    const incidentData = snapshot.val();
    const now = Date.now();

    // 3. Geographic Destination Resolution
    const destination = resolveAuthorityDestination(
      incidentData.blurredLocation?.latitude || 40.71,
      incidentData.blurredLocation?.longitude || -74.0,
      incidentData.blurredLocation?.geohash,
      incidentData.category
    );

    // 4. Exact Location Decryption (if encrypted payload present & actor authorized)
    let locationData = {
      latitude: incidentData.blurredLocation?.latitude || 0,
      longitude: incidentData.blurredLocation?.longitude || 0,
      address: incidentData.incidentLocation?.address || '',
      landmark: incidentData.incidentLocation?.landmark || '',
      geohash: incidentData.blurredLocation?.geohash || '',
      isPreciseDecrypted: false,
    };

    if (incidentData.encryptedPreciseLocation && canAccessPreciseLocation(session)) {
      try {
        const decrypted = decryptPreciseLocation(incidentData.encryptedPreciseLocation);
        locationData = {
          latitude: decrypted.lat,
          longitude: decrypted.lng,
          address: decrypted.exactAddress || incidentData.incidentLocation?.address || '',
          landmark: incidentData.incidentLocation?.landmark || '',
          geohash: incidentData.blurredLocation?.geohash || '',
          isPreciseDecrypted: true,
        };
      } catch (err: any) {
        console.warn('[AuthorityNotificationService] Precise location decryption fallback:', err.message);
      }
    }

    // 5. Construct Authority-specific Payload
    const notificationId = `notif_${Date.now()}_${incidentId.substring(0, 6)}`;
    const payload: AuthorityPayload = {
      notificationId,
      incidentId,
      category: incidentData.category || 'EMERGENCY_OTHER',
      title: incidentData.title || 'Emergency Incident Alert',
      description: incidentData.description || 'No description provided.',
      dangerLevel: incidentData.dangerLevel || incidentData.severity || 'HIGH',
      incidentLocation: locationData,
      evidence: (incidentData.evidence || []).map((e: any) => ({
        id: e.id,
        url: e.url,
        type: e.type,
        name: e.name,
      })),
      timestamp: now,
      metadata: {
        reporterLabel: 'Reported by a verified community member',
        communityId: incidentData.communityId || 'comm_central',
      },
    };

    // 6. Create Initial Escalation Record (status: PENDING)
    const escalationId = `esc_${Date.now()}_${incidentId.substring(0, 6)}`;
    const initialRecord: AuthorityEscalationRecord = {
      escalationId,
      incidentId,
      authorityTarget: destination.name,
      destination,
      status: 'PENDING',
      deliveryAttempts: [],
      retryCount: 0,
      maxRetries: 3,
      escalatedAt: now,
      lastAttemptAt: now,
      payloadHash: '',
    };

    // Write PENDING record to RTDB
    await set(ref(rtdb, `authorityEscalations/${incidentId}`), initialRecord);

    // 7. Dispatch Notification to Provider
    const attemptRecord: DeliveryAttemptRecord = {
      attemptNumber: 1,
      timestamp: Date.now(),
      status: 'PENDING',
    };

    let result: NotificationResult;
    try {
      result = await this.provider.sendNotification(payload, destination);
      attemptRecord.status = result.status;
      attemptRecord.responseMessage = result.message;
      if (result.error) attemptRecord.error = result.error;
    } catch (dispatchErr: any) {
      result = {
        success: false,
        notificationId,
        status: 'FAILED',
        providerId: this.provider.providerId,
        message: 'Unexpected provider dispatch failure.',
        error: dispatchErr.message,
      };
      attemptRecord.status = 'FAILED';
      attemptRecord.error = dispatchErr.message;
    }

    // 8. Update Record with Confirmation Result (Strictly requiring provider confirmation)
    const finalStatus = result.success && result.status === 'DELIVERED' ? 'DELIVERED' : 'FAILED';
    const updatedRecord: AuthorityEscalationRecord = {
      ...initialRecord,
      status: finalStatus,
      deliveryAttempts: [attemptRecord],
      lastAttemptAt: Date.now(),
      deliveredAt: result.deliveredAt,
    };

    // Save updated escalation record
    await set(ref(rtdb, `authorityEscalations/${incidentId}`), updatedRecord);

    // Update incident status in RTDB
    await update(ref(rtdb, `incidents/${incidentId}`), {
      authorityNotificationStatus: finalStatus,
      status: 'ESCALATED',
      updatedAt: Date.now(),
    });

    // 9. Generate Signed Audit Log
    const auditEntry = createAuthorityEscalationAuditLog({
      incidentId,
      actorPseudonymId: session.pseudonymId || `user_${session.userId}`,
      authorityTarget: destination.name,
      reason,
    });

    updatedRecord.payloadHash = auditEntry.payloadHash;
    await set(ref(rtdb, `authorityEscalations/${incidentId}/payloadHash`), auditEntry.payloadHash);

    // Write to write-locked audit log node
    await set(ref(rtdb, `escalationAuditLogs/${auditEntry.logId}`), auditEntry);

    return updatedRecord;
  }

  /**
   * Process retries for failed authority notifications.
   */
  public async retryDelivery(
    session: UserSession,
    incidentId: string
  ): Promise<AuthorityEscalationRecord> {
    const isAuthorized =
      session.isAuthenticated &&
      ['AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN', 'VERIFIED_COMMUNITY_LEADER'].includes(session.role);

    if (!isAuthorized) {
      throw new Error('UNAUTHORIZED: Insufficient permissions to retry authority escalations.');
    }

    const escRef = ref(rtdb, `authorityEscalations/${incidentId}`);
    const snapshot = await get(escRef);

    if (!snapshot.exists()) {
      throw new Error(`NOT_FOUND: Escalation record for ${incidentId} not found.`);
    }

    const record = snapshot.val() as AuthorityEscalationRecord;

    if (record.status === 'DELIVERED' || record.status === 'ACKNOWLEDGED') {
      return record; // Already delivered or acknowledged
    }

    if (record.retryCount >= record.maxRetries) {
      throw new Error(`MAX_RETRIES_EXCEEDED: Maximum retry limit of ${record.maxRetries} reached for incident ${incidentId}.`);
    }

    const newAttemptNumber = record.retryCount + 1;
    const now = Date.now();

    const payload: AuthorityPayload = {
      notificationId: `retry_${now}_${incidentId.substring(0, 6)}`,
      incidentId,
      category: 'EMERGENCY_OTHER',
      title: 'Escalation Retry Alert',
      description: 'Retrying authority escalation dispatch.',
      dangerLevel: 'HIGH',
      incidentLocation: {
        latitude: record.destination?.geohashPrefix ? 40.71 : 0,
        longitude: -74.0,
        geohash: record.destination?.geohashPrefix || 'dr5ru',
      },
      evidence: [],
      timestamp: now,
      metadata: {
        reporterLabel: 'Reported by a verified community member',
        communityId: 'comm_central',
      },
    };

    const result = await this.provider.sendNotification(payload, record.destination);

    const attemptRecord: DeliveryAttemptRecord = {
      attemptNumber: newAttemptNumber + 1,
      timestamp: now,
      status: result.status,
      responseMessage: result.message,
      error: result.error,
    };

    const updatedRecord: AuthorityEscalationRecord = {
      ...record,
      status: result.success && result.status === 'DELIVERED' ? 'DELIVERED' : 'FAILED',
      retryCount: newAttemptNumber,
      deliveryAttempts: [...(record.deliveryAttempts || []), attemptRecord],
      lastAttemptAt: now,
      deliveredAt: result.deliveredAt || record.deliveredAt,
    };

    await set(escRef, updatedRecord);
    await update(ref(rtdb, `incidents/${incidentId}`), {
      authorityNotificationStatus: updatedRecord.status,
      updatedAt: now,
    });

    return updatedRecord;
  }

  /**
   * Authority dispatcher acknowledgment workflow.
   */
  public async acknowledgeEscalation(
    session: UserSession,
    incidentId: string
  ): Promise<AuthorityEscalationRecord> {
    if (!canAccessPreciseLocation(session)) {
      throw new Error('UNAUTHORIZED: Only authorized authority dispatchers or system admins can acknowledge escalations.');
    }

    const escRef = ref(rtdb, `authorityEscalations/${incidentId}`);
    const snapshot = await get(escRef);

    if (!snapshot.exists()) {
      throw new Error(`NOT_FOUND: Escalation record for incident ${incidentId} not found.`);
    }

    const record = snapshot.val() as AuthorityEscalationRecord;
    const now = Date.now();

    const ackResult = await this.provider.acknowledgeNotification(record.escalationId, session.userId || 'dispatcher');

    const updatedRecord: AuthorityEscalationRecord = {
      ...record,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: now,
      acknowledgedByActorId: session.userId,
    };

    await set(escRef, updatedRecord);
    await update(ref(rtdb, `incidents/${incidentId}`), {
      authorityNotificationStatus: 'ACKNOWLEDGED',
      updatedAt: now,
    });

    return updatedRecord;
  }

  /**
   * Authority-only status fetch with data layer security isolation.
   */
  public async getEscalationStatus(
    session: UserSession,
    incidentId: string
  ): Promise<AuthorityEscalationRecord | null> {
    // COMMUNITY MEMBER PRIVACY ISOLATION: Community members CANNOT access authority escalation data.
    const isAuthority =
      session.isAuthenticated &&
      (session.role === 'AUTHORITY_DISPATCHER' || session.role === 'SYSTEM_ADMIN' || session.role === 'VERIFIED_COMMUNITY_LEADER');

    if (!isAuthority) {
      throw new Error('UNAUTHORIZED: Community members are restricted from accessing authority escalation records.');
    }

    const escRef = ref(rtdb, `authorityEscalations/${incidentId}`);
    const snapshot = await get(escRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as AuthorityEscalationRecord;
  }
}
