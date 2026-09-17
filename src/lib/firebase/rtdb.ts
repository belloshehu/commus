import { 
  ref, 
  push, 
  set, 
  update, 
  onValue, 
  query, 
  orderByChild, 
  equalTo, 
  Unsubscribe,
  get
} from 'firebase/database';
import { rtdb } from './client';
import { UserSession, canSubmitIncident } from '../auth';

export type IncidentCategory = 
  | 'TRAFFIC_HAZARD'
  | 'INFRASTRUCTURE_FAILURE'
  | 'DISTURBANCE'
  | 'CROWD_SAFETY_ALERT'
  | 'EMERGENCY_OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'SUBMITTED' | 'VERIFIED' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';

export interface BlurredLocation {
  latitude: number;
  longitude: number;
  geohash: string;
}

export interface RiskAssessment {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evaluatedAt: number;
  aiSummary: string;
}

export interface IncidentRecord {
  id?: string;
  communityId: string;
  category: IncidentCategory;
  title: string;
  description: string;
  reporterLabel: string;
  blurredLocation: BlurredLocation;
  encryptedPreciseLocation: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  riskAssessment?: RiskAssessment;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityAlert {
  alertId?: string;
  incidentId: string;
  title: string;
  riskLevel: string;
  message: string;
  safetyDisclaimer: string;
  issuedAt: number;
}

export interface ActiveCoordination {
  status: 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED';
  coordinationNotes: string;
  updatedAt: number;
}

/**
 * PUBLIC REPORTERS PRIVACY GUARANTEE:
 * 1. reporterLabel is strictly set to "Reported by a verified community member".
 * 2. reporterUid is isolated in /incidentReportersPrivate strictly accessible by authorities/admin.
 */
export async function createIncidentReport(
  session: UserSession,
  payload: Omit<IncidentRecord, 'id' | 'reporterLabel' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ incidentId: string }> {
  if (!canSubmitIncident(session)) {
    throw new Error('UNAUTHORIZED: Anonymous users and unauthenticated users cannot submit incident reports.');
  }

  if (!session.userId) {
    throw new Error('UNAUTHORIZED: User ID missing from session.');
  }

  const incidentRef = push(ref(rtdb, 'incidents'));
  const incidentId = incidentRef.key;

  if (!incidentId) {
    throw new Error('DATABASE_ERROR: Failed to generate incident key.');
  }

  const now = Date.now();

  const publicIncidentData: IncidentRecord = {
    ...payload,
    id: incidentId,
    reporterLabel: 'Reported by a verified community member',
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  // Write public incident record
  await set(ref(rtdb, `incidents/${incidentId}`), publicIncidentData);

  // Write isolated private reporter identity
  await set(ref(rtdb, `incidentReportersPrivate/${incidentId}`), {
    reporterUid: session.userId,
    submittedAt: now,
  });

  return { incidentId };
}

/**
 * RTDB Real-time subscription to community incident feed.
 * Listens for immediate incident updates across a specific community.
 */
export function subscribeToCommunityIncidents(
  communityId: string,
  callback: (incidents: IncidentRecord[]) => void
): Unsubscribe {
  const incidentsQuery = query(
    ref(rtdb, 'incidents'),
    orderByChild('communityId'),
    equalTo(communityId)
  );

  return onValue(incidentsQuery, (snapshot: any) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const incidentList: IncidentRecord[] = Object.keys(data).map((key) => ({
      ...data[key],
      id: key,
    }));
    callback(incidentList);
  });
}

/**
 * RTDB Real-time subscription for a single incident's status and details.
 */
export function subscribeToIncident(
  incidentId: string,
  callback: (incident: IncidentRecord | null) => void
): Unsubscribe {
  const incidentRef = ref(rtdb, `incidents/${incidentId}`);

  return onValue(incidentRef, (snapshot: any) => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }
    callback({ ...data, id: incidentId });
  });
}

/**
 * RTDB Real-time subscription for high-risk community alerts.
 */
export function subscribeToCommunityAlerts(
  communityId: string,
  callback: (alerts: CommunityAlert[]) => void
): Unsubscribe {
  const alertsRef = ref(rtdb, `communityAlerts/${communityId}`);

  return onValue(alertsRef, (snapshot: any) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const alertsList: CommunityAlert[] = Object.keys(data).map((key) => ({
      ...data[key],
      alertId: key,
    }));
    callback(alertsList);
  });
}

/**
 * RTDB Real-time subscription for active response coordination.
 */
export function subscribeToActiveCoordination(
  incidentId: string,
  callback: (coordination: ActiveCoordination | null) => void
): Unsubscribe {
  const coordRef = ref(rtdb, `activeResponseCoordination/${incidentId}`);

  return onValue(coordRef, (snapshot: any) => {
    const data = snapshot.val();
    callback(data || null);
  });
}

/**
 * Update incident status (restricted to community leaders, dispatchers, or system admins).
 */
export async function updateIncidentStatus(
  session: UserSession,
  incidentId: string,
  newStatus: IncidentStatus
): Promise<void> {
  const isAllowed = session.isAuthenticated && 
    ['VERIFIED_COMMUNITY_LEADER', 'AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN'].includes(session.role);

  if (!isAllowed) {
    throw new Error('UNAUTHORIZED: Insufficient permissions to update incident status.');
  }

  const updates: Record<string, any> = {
    [`incidents/${incidentId}/status`]: newStatus,
    [`incidents/${incidentId}/updatedAt`]: Date.now(),
  };

  await update(ref(rtdb), updates);
}
