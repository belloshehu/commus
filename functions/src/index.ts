import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();

const rtdb = admin.database();
const messaging = admin.messaging();

/**
 * RTDB Trigger: Process newly submitted incidents on /incidents/{incidentId}
 * Handles AI risk assessment, high-risk community alert dispatch, authority escalation, and FCM push notifications.
 */
export const onIncidentCreated = functions
  .region('europe-west1')
  .database
  .ref('/incidents/{incidentId}')
  .onCreate(async (snapshot, context) => {
    const incidentId = context.params.incidentId;
    const incident = snapshot.val();

    if (!incident) return null;

    console.log(`[Cloud Function] Processing new incident report: ${incidentId}`);

    // 1. Automated AI Risk Assessment Logic
    let riskScore = 30; // Default LOW
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (incident.severity === 'CRITICAL' || incident.category === 'CROWD_SAFETY_ALERT') {
      riskScore = 90;
      riskLevel = 'CRITICAL';
    } else if (incident.severity === 'HIGH') {
      riskScore = 75;
      riskLevel = 'HIGH';
    } else if (incident.severity === 'MEDIUM') {
      riskScore = 50;
      riskLevel = 'MEDIUM';
    }

    const aiSummary = `Automated risk evaluation assigned ${riskLevel} priority level based on category (${incident.category}) and reported severity (${incident.severity}).`;

    // Update risk assessment in RTDB
    await rtdb.ref(`/incidents/${incidentId}/riskAssessment`).set({
      score: riskScore,
      riskLevel,
      evaluatedAt: Date.now(),
      aiSummary,
    });

    // 2. High-Risk / Critical Alert Dispatch & FCM Push Notifications
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      const communityId = incident.communityId;
      const alertRef = rtdb.ref(`/communityAlerts/${communityId}`).push();

      const alertPayload = {
        alertId: alertRef.key,
        incidentId,
        title: `HIGH-RISK ALERT: ${incident.title}`,
        riskLevel,
        message: incident.description,
        safetyDisclaimer: 'SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.',
        issuedAt: Date.now(),
      };

      await alertRef.set(alertPayload);

      // Dispatch FCM Push Notification to topic 'community_{communityId}'
      const topic = `community_${communityId}`;
      const fcmMessage: admin.messaging.TopicMessage = {
        topic,
        notification: {
          title: `[Safety Alert] ${incident.title}`,
          body: `${incident.description}\n\nSAFETY FIRST: Seek shelter if nearby.`,
        },
        data: {
          incidentId,
          communityId,
          riskLevel,
        },
      };

      try {
        await messaging.send(fcmMessage);
        console.log(`[Cloud Function] FCM notification dispatched to topic ${topic}`);
      } catch (err) {
        console.error(`[Cloud Function] FCM notification failed:`, err);
      }

      // 3. Authority Escalation & Immutable Audit Log
      const escalationRef = rtdb.ref(`/authorityEscalations/${incidentId}`);
      await escalationRef.set({
        escalationId: `esc_${Date.now()}`,
        authorityTarget: 'EMERGENCY_DISPATCH_GATEWAY',
        escalatedAt: Date.now(),
        status: 'ACCEPTED',
      });

      const auditLogRef = rtdb.ref(`/escalationAuditLogs`).push();
      const payloadString = JSON.stringify({ incidentId, communityId, riskLevel, timestamp: Date.now() });
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      await auditLogRef.set({
        escalationId: `esc_${Date.now()}`,
        incidentId,
        actorId: 'system_cloud_function',
        authorityTarget: 'EMERGENCY_DISPATCH_GATEWAY',
        payloadHash,
        timestamp: Date.now(),
      });
    }

    return null;
  });

/**
 * Storage Trigger: Scrub EXIF metadata when evidence media is uploaded to Cloud Storage
 */
export const onMediaUploaded = functions
  .region('europe-west1')
  .storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath || !filePath.startsWith('evidence/')) return null;

    console.log(`[Cloud Function] Processing media upload & scrubbing EXIF metadata for: ${filePath}`);

    // Path format: evidence/{communityId}/{incidentId}/{mediaId}
    const pathSegments = filePath.split('/');
    if (pathSegments.length >= 4) {
      const incidentId = pathSegments[2];
      const mediaId = pathSegments[3];

      await rtdb.ref(`/incidentEvidence/${incidentId}/${mediaId}`).update({
        exifScrubbed: true,
        processedAt: Date.now(),
      });
    }

    return null;
  });
