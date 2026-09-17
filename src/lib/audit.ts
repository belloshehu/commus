import crypto from 'crypto';

export interface AuditLogParams {
  incidentId: string;
  actorPseudonymId: string;
  authorityTarget: string;
  reason: string;
}

export interface EscalationAuditLogEntry extends AuditLogParams {
  logId: string;
  timestamp: string;
  payloadHash: string;
  digitalSignature: string;
}

/**
 * Creates an auditable, hash-signed record of an authority escalation event.
 * Ensures total accountability for emergency escalations.
 */
export function createAuthorityEscalationAuditLog(
  params: AuditLogParams,
  signingKeySecret: string = 'antijj_audit_secret_key'
): EscalationAuditLogEntry {
  const timestamp = new Date().toISOString();
  const logId = `audit_${crypto.randomBytes(8).toString('hex')}`;

  const payloadString = JSON.stringify({
    logId,
    incidentId: params.incidentId,
    actorPseudonymId: params.actorPseudonymId,
    authorityTarget: params.authorityTarget,
    reason: params.reason,
    timestamp
  });

  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
  const digitalSignature = crypto.createHmac('sha256', signingKeySecret).update(payloadHash).digest('hex');

  return {
    ...params,
    logId,
    timestamp,
    payloadHash,
    digitalSignature
  };
}
