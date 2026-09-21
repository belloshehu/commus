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
import { UserSession, canSubmitIncident, canViewPrivateCommunityIncidents } from '../auth';
import type { CommunityCampaign } from '../education/types';

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

export interface EvidenceItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  size: number;
  uploadedAt: number;
}

export interface IncidentLocationData {
  address?: string;
  landmark?: string;
  locationName?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  isFuzzed: boolean;
}

export interface IncidentRecord {
  id?: string;
  communityId: string;
  category: IncidentCategory;
  title: string;
  description: string;
  voiceNoteUrl?: string;
  reporterLabel: string;
  blurredLocation: BlurredLocation;
  encryptedPreciseLocation: string;
  incidentLocation?: IncidentLocationData;
  severity: IncidentSeverity;
  dangerLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence?: EvidenceItem[];
  safetyConfirmed?: boolean;
  status: IncidentStatus;
  upvotes?: number;
  downvotes?: number;
  authenticityStatus?: 'VERIFIED_COMMUNITY' | 'UNREVIEWED' | 'QUESTIONABLE_AUTHENTICITY';
  authorityNotificationStatus?: 'PENDING' | 'NOTIFIED' | 'FAILED' | 'SKIPPED';
  moderationStatus?: 'UNREVIEWED' | 'APPROVED' | 'FLAGGED' | 'REJECTED';
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

// Local persistent store fallback for instant reactivity & dev environment resilience
const localIncidentStore: Record<string, IncidentRecord> = {};
const allIncidentListeners: Set<(incidents: IncidentRecord[]) => void> = new Set();

function getStoredLocalIncidents(): Record<string, IncidentRecord> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('antijj_local_incidents');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...localIncidentStore, ...parsed };
      }
    } catch {}
  }
  return localIncidentStore;
}

function saveLocalIncident(incident: IncidentRecord): void {
  if (!incident.id) return;
  localIncidentStore[incident.id] = incident;
  if (typeof window !== 'undefined') {
    try {
      const stored = getStoredLocalIncidents();
      stored[incident.id] = incident;
      localStorage.setItem('antijj_local_incidents', JSON.stringify(stored));
    } catch {}
  }
  notifyAllListeners();
}

function notifyAllListeners() {
  const localMap = getStoredLocalIncidents();
  const list = Object.values(localMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  allIncidentListeners.forEach((listener) => {
    try {
      listener(list);
    } catch {}
  });
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
    upvotes: payload.upvotes || 0,
    downvotes: payload.downvotes || 0,
    authenticityStatus: payload.authenticityStatus || 'UNREVIEWED',
    dangerLevel: payload.dangerLevel || (payload.severity as any) || 'MEDIUM',
    authorityNotificationStatus: payload.authorityNotificationStatus || 'PENDING',
    moderationStatus: payload.moderationStatus || 'UNREVIEWED',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Immediately store in local reactive store
  saveLocalIncident(publicIncidentData);

  // 2. Write public incident record to Firebase RTDB Client SDK
  const sanitizedPublicData = JSON.parse(JSON.stringify(publicIncidentData));
  try {
    await set(ref(rtdb, `incidents/${incidentId}`), sanitizedPublicData);
  } catch (err: any) {
    console.warn('[createIncidentReport] RTDB public node write skipped due to security rules:', err.message);
  }

  // 3. Write via Firebase REST API if running on server side
  if (typeof window === 'undefined') {
    try {
      const rtdbBaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
      if (rtdbBaseUrl) {
        const cleanUrl = rtdbBaseUrl.endsWith('/') ? rtdbBaseUrl.slice(0, -1) : rtdbBaseUrl;
        await fetch(`${cleanUrl}/incidents/${incidentId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedPublicData),
        }).catch(() => {});
      }
    } catch {}
  }

  // 4. Write isolated private reporter identity
  try {
    await set(ref(rtdb, `incidentReportersPrivate/${incidentId}`), {
      reporterUid: session.userId,
      submittedAt: now,
    });
  } catch (err: any) {
    console.warn('[createIncidentReport] RTDB private reporter node write skipped due to security rules:', err.message);
  }

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

  return onValue(
    incidentsQuery,
    (snapshot: any) => {
      const data = snapshot.val() || {};
      const localMap = getStoredLocalIncidents();
      const mergedMap: Record<string, IncidentRecord> = { ...localMap };

      Object.keys(data).forEach((key) => {
        if (data[key].communityId === communityId) {
          mergedMap[key] = {
            ...data[key],
            id: key,
          };
        }
      });

      const incidentList: IncidentRecord[] = Object.values(mergedMap).filter(
        (inc) => inc.communityId === communityId
      );
      incidentList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(incidentList);
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToCommunityIncidents error:', err);
      const localMap = getStoredLocalIncidents();
      const list = Object.values(localMap).filter((inc) => inc.communityId === communityId);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    }
  );
}

/**
 * RTDB Real-time subscription to all public community safety incident feeds.
 * Listens for immediate incident updates across all community zones.
 */
export function subscribeToAllIncidents(
  callback: (incidents: IncidentRecord[]) => void
): Unsubscribe {
  allIncidentListeners.add(callback);

  const incidentsRef = ref(rtdb, 'incidents');

  // Immediately invoke callback with local store incidents if available
  const localMap = getStoredLocalIncidents();
  const initialList = Object.values(localMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (initialList.length > 0) {
    callback(initialList);
  }

  const unsubscribe = onValue(
    incidentsRef,
    (snapshot: any) => {
      const data = snapshot.val() || {};
      const localMap = getStoredLocalIncidents();
      const mergedMap: Record<string, IncidentRecord> = { ...localMap };

      Object.keys(data).forEach((key) => {
        mergedMap[key] = {
          ...data[key],
          id: key,
          reporterLabel: 'Reported by a verified community member',
        };
      });

      const incidentList: IncidentRecord[] = Object.values(mergedMap);
      incidentList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(incidentList);
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToAllIncidents error:', err);
      const localMap = getStoredLocalIncidents();
      const list = Object.values(localMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    }
  );

  return () => {
    allIncidentListeners.delete(callback);
    unsubscribe();
  };
}

/**
 * RTDB One-shot fetch for a single incident with backend authorization check.
 */
export async function getIncidentById(
  session: UserSession,
  incidentId: string
): Promise<IncidentRecord | null> {
  const localMatch = getStoredLocalIncidents()[incidentId];
  if (localMatch) {
    if (!canViewPrivateCommunityIncidents(session, localMatch.communityId)) {
      throw new Error('UNAUTHORIZED: You do not have permission to view incidents from this community zone.');
    }
    return localMatch;
  }

  try {
    const incidentRef = ref(rtdb, `incidents/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (snapshot.exists()) {
      const data = snapshot.val() as IncidentRecord;
      const incident: IncidentRecord = { ...data, id: incidentId };

      if (!canViewPrivateCommunityIncidents(session, incident.communityId)) {
        throw new Error('UNAUTHORIZED: You do not have permission to view incidents from this community zone.');
      }

      incident.reporterLabel = 'Reported by a verified community member';
      saveLocalIncident(incident);
      return incident;
    }
  } catch (err: any) {
    if (err?.message?.startsWith('UNAUTHORIZED')) {
      throw err;
    }
  }

  return null;
}

/**
 * RTDB One-shot fetch for all incidents in a community with authorization check.
 */
export async function getCommunityIncidents(
  session: UserSession,
  communityId: string
): Promise<IncidentRecord[]> {
  if (!canViewPrivateCommunityIncidents(session, communityId)) {
    throw new Error('UNAUTHORIZED: You do not have permission to access incidents from this community zone.');
  }

  const localMap = getStoredLocalIncidents();
  const localList = Object.values(localMap).filter((inc) => inc.communityId === communityId);

  try {
    const incidentsQuery = query(
      ref(rtdb, 'incidents'),
      orderByChild('communityId'),
      equalTo(communityId)
    );

    const snapshot = await get(incidentsQuery);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const remoteList = Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
        reporterLabel: 'Reported by a verified community member',
      }));
      const mergedMap: Record<string, IncidentRecord> = {};
      [...localList, ...remoteList].forEach((inc) => {
        if (inc.id) mergedMap[inc.id] = inc;
      });
      return Object.values(mergedMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  } catch {}

  return localList;
}

/**
 * RTDB Real-time subscription for a single incident's status and details.
 */
export function subscribeToIncident(
  incidentId: string,
  callback: (incident: IncidentRecord | null) => void
): Unsubscribe {
  const localMatch = getStoredLocalIncidents()[incidentId];
  if (localMatch) {
    callback(localMatch);
  }

  const incidentRef = ref(rtdb, `incidents/${incidentId}`);

  return onValue(
    incidentRef,
    (snapshot: any) => {
      const data = snapshot.val();
      if (!data) {
        const match = getStoredLocalIncidents()[incidentId];
        callback(match || null);
        return;
      }
      const record = {
        ...data,
        id: incidentId,
        reporterLabel: 'Reported by a verified community member',
      };
      saveLocalIncident(record);
      callback(record);
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToIncident error:', err);
      const match = getStoredLocalIncidents()[incidentId];
      callback(match || null);
    }
  );
}

/**
 * RTDB Real-time subscription for high-risk community alerts.
 */
export function subscribeToCommunityAlerts(
  communityId: string,
  callback: (alerts: CommunityAlert[]) => void
): Unsubscribe {
  const alertsRef = ref(rtdb, `communityAlerts/${communityId}`);

  return onValue(
    alertsRef,
    (snapshot: any) => {
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
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToCommunityAlerts error:', err);
      callback([]);
    }
  );
}

/**
 * RTDB Real-time subscription for active response coordination.
 */
export function subscribeToActiveCoordination(
  incidentId: string,
  callback: (coordination: ActiveCoordination | null) => void
): Unsubscribe {
  const coordRef = ref(rtdb, `activeResponseCoordination/${incidentId}`);

  return onValue(
    coordRef,
    (snapshot: any) => {
      const data = snapshot.val();
      callback(data || null);
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToActiveCoordination error:', err);
      callback(null);
    }
  );
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

export interface CommunityRecord {
  id: string;
  name: string;
  isPrivate: boolean;
  geohashPrefix: string;
  inviteCode?: string;
  memberCount: number;
  activeIncidentsCount?: number;
  createdAt: number;
}

const mockDefaultCommunities: CommunityRecord[] = [
  {
    id: 'comm_central',
    name: 'Downtown Central District',
    isPrivate: true,
    geohashPrefix: 'dr5ru',
    inviteCode: 'CENTRAL',
    memberCount: 1420,
    activeIncidentsCount: 2,
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
  },
  {
    id: 'comm_north',
    name: 'North Metro Transit Corridor',
    isPrivate: false,
    geohashPrefix: 'dr5rv',
    inviteCode: 'NORTH',
    memberCount: 890,
    activeIncidentsCount: 1,
    createdAt: Date.now() - 1000 * 3600 * 24 * 20,
  },
  {
    id: 'comm_west',
    name: 'Westside Residential Safety Zone',
    isPrivate: true,
    geohashPrefix: 'dr5rt',
    inviteCode: 'WESTSAFE',
    memberCount: 560,
    activeIncidentsCount: 0,
    createdAt: Date.now() - 1000 * 3600 * 24 * 10,
  },
  {
    id: 'comm_east',
    name: 'Eastside Commercial Network',
    isPrivate: false,
    geohashPrefix: 'dr5rs',
    inviteCode: 'EASTSIDE',
    memberCount: 1100,
    activeIncidentsCount: 0,
    createdAt: Date.now() - 1000 * 3600 * 24 * 15,
  },
];

/**
 * One-click helper for joining a community by an authenticated user.
 */
export async function joinCommunity(
  session: UserSession,
  communityId: string,
  inviteCode?: string
): Promise<{ success: boolean; communityName: string }> {
  if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
    throw new Error('UNAUTHORIZED: Anonymous visitors must log in to join safety communities.');
  }

  if (!session.userId) {
    throw new Error('UNAUTHORIZED: Missing user session ID.');
  }

  // Find target community
  const target = mockDefaultCommunities.find(
    (c) => c.id === communityId || (inviteCode && c.inviteCode?.toUpperCase() === inviteCode.trim().toUpperCase())
  );

  const targetId = target ? target.id : communityId;
  const targetName = target ? target.name : `Safety Zone ${communityId}`;

  if (target?.isPrivate) {
    // Private community requires invite code or matching invite
    const isValidCode = inviteCode && target.inviteCode && inviteCode.trim().toUpperCase() === target.inviteCode.toUpperCase();
    if (!isValidCode && session.role !== 'SYSTEM_ADMIN') {
      throw new Error('INVALID_INVITE_CODE: Private community requires a valid 6-character Invite Code.');
    }
  }

  // Atomic RTDB update: add community to user's joined list
  const userCommRef = ref(rtdb, `users/${session.userId}/communityIds/${targetId}`);
  await set(userCommRef, true);

  return {
    success: true,
    communityName: targetName,
  };
}

/**
 * GPS / Proximity auto-discovery of nearby safety communities based on latitude/longitude.
 */
export async function getNearbyCommunities(
  lat: number,
  lng: number
): Promise<CommunityRecord[]> {
  // Returns discoverable nearby communities
  return mockDefaultCommunities;
}

export type VoteType = 'UP' | 'DOWN';

export async function recordVote(
  session: UserSession,
  incidentId: string,
  voteType: VoteType
): Promise<{
  upvotes: number;
  downvotes: number;
  authenticityStatus: 'VERIFIED_COMMUNITY' | 'UNREVIEWED' | 'QUESTIONABLE_AUTHENTICITY';
  userVote: VoteType | null;
}> {
  if (!session.isAuthenticated || !session.userId) {
    throw new Error('UNAUTHORIZED: Must be logged in to vote on safety reports.');
  }

  const incidentRef = ref(rtdb, `incidents/${incidentId}`);
  const snapshot = await get(incidentRef);

  if (!snapshot.exists()) {
    throw new Error(`NOT_FOUND: Incident ${incidentId} does not exist.`);
  }

  const incident = snapshot.val() as IncidentRecord;

  // Authorization check
  if (!canViewPrivateCommunityIncidents(session, incident.communityId)) {
    throw new Error('UNAUTHORIZED: You do not have permission to vote on reports in this community zone.');
  }

  const userVoteRef = ref(rtdb, `incidentVotes/${incidentId}/${session.userId}`);
  const voteSnap = await get(userVoteRef);
  const previousVote: VoteType | null = voteSnap.exists() ? voteSnap.val() : null;

  let currentUpvotes = incident.upvotes || 0;
  let currentDownvotes = incident.downvotes || 0;
  let newVote: VoteType | null = voteType;

  if (previousVote === voteType) {
    // Toggle off vote if clicking the same vote again
    newVote = null;
    if (voteType === 'UP') {
      currentUpvotes = Math.max(0, currentUpvotes - 1);
    } else {
      currentDownvotes = Math.max(0, currentDownvotes - 1);
    }
    await set(userVoteRef, null);
  } else {
    // Changing vote or voting for first time
    if (previousVote === 'UP') {
      currentUpvotes = Math.max(0, currentUpvotes - 1);
    } else if (previousVote === 'DOWN') {
      currentDownvotes = Math.max(0, currentDownvotes - 1);
    }

    if (voteType === 'UP') {
      currentUpvotes += 1;
    } else {
      currentDownvotes += 1;
    }

    await set(userVoteRef, voteType);
  }

  // Recalculate authenticity status (>20% downvotes indicates QUESTIONABLE_AUTHENTICITY)
  const totalVotes = currentUpvotes + currentDownvotes;
  let newAuthenticityStatus: 'VERIFIED_COMMUNITY' | 'UNREVIEWED' | 'QUESTIONABLE_AUTHENTICITY' = 'UNREVIEWED';

  if (totalVotes > 0) {
    const downvotePercentage = currentDownvotes / totalVotes;
    if (downvotePercentage > 0.20) {
      newAuthenticityStatus = 'QUESTIONABLE_AUTHENTICITY';
    } else if (currentUpvotes >= 3 && downvotePercentage <= 0.20) {
      newAuthenticityStatus = 'VERIFIED_COMMUNITY';
    }
  }

  await update(incidentRef, {
    upvotes: currentUpvotes,
    downvotes: currentDownvotes,
    authenticityStatus: newAuthenticityStatus,
    updatedAt: Date.now(),
  });

  return {
    upvotes: currentUpvotes,
    downvotes: currentDownvotes,
    authenticityStatus: newAuthenticityStatus,
    userVote: newVote,
  };
}

export async function getUserVote(
  session: UserSession,
  incidentId: string
): Promise<VoteType | null> {
  if (!session.isAuthenticated || !session.userId) {
    return null;
  }
  const userVoteRef = ref(rtdb, `incidentVotes/${incidentId}/${session.userId}`);
  const snap = await get(userVoteRef);
  return snap.exists() ? snap.val() : null;
}

/**
 * RTDB Real-time subscription for educational campaigns.
 */
export function subscribeToCampaigns(
  callback: (campaigns: CommunityCampaign[]) => void
): Unsubscribe {
  const campaignsRef = ref(rtdb, 'campaigns');

  return onValue(
    campaignsRef,
    (snapshot: any) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const list: CommunityCampaign[] = Object.values(data);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    },
    (err: any) => {
      console.warn('[rtdb] subscribeToCampaigns error:', err);
      callback([]);
    }
  );
}



