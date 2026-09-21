import crypto from 'crypto';
import { ref, get, set, update, remove } from 'firebase/database';
import { rtdb } from './firebase/client';
import { UserSession, UserRole, assertSystemAdmin } from './auth';
import { EducationalTip, CommunityCampaign, CampaignStatus, BadgeDefinition, UserBadgeAward } from './education/types';
import { PRE_SEEDED_TIPS } from './education/tipsData';
import { ALL_BADGE_DEFINITIONS } from './badges/definitions';

export interface AdminUserRecord {
  userId: string;
  pseudonymId: string;
  name: string;
  email: string;
  role: UserRole;
  communityId?: string;
  communityName?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  createdAt: number;
  lastLoginAt: number;
  reportsSubmittedCount: number;
  suspensionReason?: string;
}

export interface AdminCommunityRecord {
  id: string;
  name: string;
  region: string;
  description: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  memberCount: number;
  createdAt: number;
  leaderPseudonymId: string;
  pendingMembers: string[];
}

export type ModerationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'FLAGGED' | 'REJECTED';

export interface AdminIncidentRecord {
  id: string;
  title: string;
  description: string;
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  communityId: string;
  reporterPseudonymId: string;
  moderationStatus: ModerationStatus;
  abuseReportsCount: number;
  authorityNotificationStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'NONE';
  createdAt: number;
  reviewNotes?: string;
}

export interface AuthorityProviderConfig {
  id: string;
  name: string;
  type: 'OFFICIAL_API' | 'SECURE_EMAIL' | 'SMS_GATEWAY' | 'MOCK_DISPATCH';
  isEnabled: boolean;
  endpointUrl: string;
  retryLimit: number;
  lastHealthCheck: number;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
}

export interface BadgeRevocationAuditLog {
  logId: string;
  revokedAt: number;
  userId: string;
  awardId: string;
  badgeId: string;
  revokedByAdminId: string;
  reason: string;
  payloadHash: string;
}

export interface AggregateAnalytics {
  totalIncidents: number;
  incidentsByDangerLevel: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  totalCommunities: number;
  totalUsers: number;
  activeUsers: number;
  responseStatuses: {
    PENDING: number;
    SENT: number;
    DELIVERED: number;
    FAILED: number;
  };
  campaignParticipation: number;
  totalBadgeAwards: number;
  revokedBadgeCount: number;
}

// In-Memory Seed Data for Fallback when RTDB is empty or in mock test mode
const SEED_USERS: AdminUserRecord[] = [
  {
    userId: 'usr_admin_1',
    pseudonymId: 'pseudo_admin_prime',
    name: 'System Admin',
    email: 'admin@antijj.org',
    role: 'SYSTEM_ADMIN',
    communityId: 'comm_central',
    communityName: 'Lagos Safety Alliance',
    accountStatus: 'ACTIVE',
    createdAt: Date.now() - 30 * 86400000,
    lastLoginAt: Date.now() - 3600000,
    reportsSubmittedCount: 0,
  },
  {
    userId: 'usr_leader_1',
    pseudonymId: 'pseudo_leader_lagos',
    name: 'Chief Moderator Ibrahim',
    email: 'ibrahim@community.org',
    role: 'VERIFIED_COMMUNITY_LEADER',
    communityId: 'comm_central',
    communityName: 'Lagos Safety Alliance',
    accountStatus: 'ACTIVE',
    createdAt: Date.now() - 20 * 86400000,
    lastLoginAt: Date.now() - 7200000,
    reportsSubmittedCount: 12,
  },
  {
    userId: 'usr_dispatcher_1',
    pseudonymId: 'pseudo_dispatcher_npf',
    name: 'NPF Control Room',
    email: 'control@police.gov.ng',
    role: 'AUTHORITY_DISPATCHER',
    communityId: 'comm_central',
    communityName: 'Lagos Safety Alliance',
    accountStatus: 'ACTIVE',
    createdAt: Date.now() - 15 * 86400000,
    lastLoginAt: Date.now() - 1800000,
    reportsSubmittedCount: 0,
  },
  {
    userId: 'usr_citizen_1',
    pseudonymId: 'pseudo_citizen_kano',
    name: 'Kano Resident User',
    email: 'resident@kano.org',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_kano',
    communityName: 'Kano Peace Network',
    accountStatus: 'ACTIVE',
    createdAt: Date.now() - 10 * 86400000,
    lastLoginAt: Date.now() - 86400000,
    reportsSubmittedCount: 4,
  },
  {
    userId: 'usr_citizen_2',
    pseudonymId: 'pseudo_spammer_x',
    name: 'Suspended Account',
    email: 'flagged@suspicious.com',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_kano',
    communityName: 'Kano Peace Network',
    accountStatus: 'SUSPENDED',
    createdAt: Date.now() - 5 * 86400000,
    lastLoginAt: Date.now() - 2 * 86400000,
    reportsSubmittedCount: 1,
    suspensionReason: 'Submitting unverified false alerts repeatedly',
  }
];

const SEED_COMMUNITIES: AdminCommunityRecord[] = [
  {
    id: 'comm_central',
    name: 'Lagos Safety Alliance',
    region: 'Lagos State',
    description: 'Community monitoring neighborhood safety & de-escalation in Lagos',
    status: 'ACTIVE',
    memberCount: 1420,
    createdAt: Date.now() - 60 * 86400000,
    leaderPseudonymId: 'pseudo_leader_lagos',
    pendingMembers: ['usr_applicant_99'],
  },
  {
    id: 'comm_kano',
    name: 'Kano Peace Network',
    region: 'Kano State',
    description: 'Youth education and mob prevention in Kano Metro',
    status: 'ACTIVE',
    memberCount: 890,
    createdAt: Date.now() - 45 * 86400000,
    leaderPseudonymId: 'pseudo_kano_leader',
    pendingMembers: [],
  },
  {
    id: 'comm_rivers',
    name: 'Port Harcourt Watch',
    region: 'Rivers State',
    description: 'Early warning crowd monitoring',
    status: 'UNDER_REVIEW',
    memberCount: 310,
    createdAt: Date.now() - 15 * 86400000,
    leaderPseudonymId: 'pseudo_ph_leader',
    pendingMembers: ['usr_applicant_101', 'usr_applicant_102'],
  }
];

const SEED_INCIDENTS: AdminIncidentRecord[] = [
  {
    id: 'inc_101',
    title: 'Disturbance near Ikeja Market',
    description: 'Crowd gathering following minor commercial dispute; leaders de-escalating.',
    dangerLevel: 'HIGH',
    category: 'DISTURBANCE',
    communityId: 'comm_central',
    reporterPseudonymId: 'pseudo_citizen_kano',
    moderationStatus: 'APPROVED',
    abuseReportsCount: 0,
    authorityNotificationStatus: 'DELIVERED',
    createdAt: Date.now() - 1200000,
  },
  {
    id: 'inc_102',
    title: 'Traffic Gridlock & Fuel Spill',
    description: 'Tanker leak causing hazard on Express highway.',
    dangerLevel: 'MEDIUM',
    category: 'TRAFFIC_HAZARD',
    communityId: 'comm_central',
    reporterPseudonymId: 'pseudo_leader_lagos',
    moderationStatus: 'APPROVED',
    abuseReportsCount: 0,
    authorityNotificationStatus: 'SENT',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'inc_103',
    title: 'Unverified Mob Rumor Alert',
    description: 'Unsubstantiated viral message alleging incident in Sabo.',
    dangerLevel: 'LOW',
    category: 'CROWD_SAFETY_ALERT',
    communityId: 'comm_kano',
    reporterPseudonymId: 'pseudo_spammer_x',
    moderationStatus: 'FLAGGED',
    abuseReportsCount: 3,
    authorityNotificationStatus: 'NONE',
    createdAt: Date.now() - 7200000,
    reviewNotes: 'Flagged for moderation by 3 community leaders due to fake news patterns.',
  }
];

const SEED_AUTHORITY_PROVIDERS: AuthorityProviderConfig[] = [
  {
    id: 'prov_npf',
    name: 'Nigeria Police Force Dispatch Gateway',
    type: 'OFFICIAL_API',
    isEnabled: true,
    endpointUrl: 'https://api.police.gov.ng/v1/escalations',
    retryLimit: 3,
    lastHealthCheck: Date.now() - 300000,
    status: 'HEALTHY',
  },
  {
    id: 'prov_nema',
    name: 'NEMA Emergency Webhook Integration',
    type: 'SECURE_EMAIL',
    isEnabled: true,
    endpointUrl: 'https://alerts.nema.gov.ng/webhooks/incidents',
    retryLimit: 5,
    lastHealthCheck: Date.now() - 600000,
    status: 'HEALTHY',
  },
  {
    id: 'prov_frsc',
    name: 'FRSC Traffic & Highway Dispatcher',
    type: 'SMS_GATEWAY',
    isEnabled: true,
    endpointUrl: 'https://sms.frsc.gov.ng/dispatch',
    retryLimit: 3,
    lastHealthCheck: Date.now() - 1200000,
    status: 'HEALTHY',
  },
  {
    id: 'prov_mock',
    name: 'Development Mock Dispatcher',
    type: 'MOCK_DISPATCH',
    isEnabled: true,
    endpointUrl: 'mock://authority-dispatch.local',
    retryLimit: 3,
    lastHealthCheck: Date.now(),
    status: 'HEALTHY',
  }
];

export class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  // --- 1. USER MANAGEMENT ---

  public async getUsers(session: UserSession): Promise<AdminUserRecord[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'adminUsers'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for users:', err.message);
    }
    return SEED_USERS;
  }

  public async updateUserRole(
    session: UserSession,
    targetUserId: string,
    newRole: UserRole,
    reason: string = 'Role updated by administrator'
  ): Promise<AdminUserRecord> {
    assertSystemAdmin(session);

    const users = await this.getUsers(session);
    const targetUser = users.find((u) => u.userId === targetUserId);

    const oldRole = targetUser?.role || 'CITIZEN_MEMBER';
    const updatedUser: AdminUserRecord = {
      ...(targetUser || {
        userId: targetUserId,
        pseudonymId: `pseudo_${targetUserId.slice(0, 8)}`,
        name: 'User Account',
        email: 'user@antijj.org',
        role: newRole,
        accountStatus: 'ACTIVE',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        reportsSubmittedCount: 0,
      }),
      role: newRole,
    };

    try {
      await update(ref(rtdb, `adminUsers/${targetUserId}`), { role: newRole });
      await update(ref(rtdb, `users/${targetUserId}`), { role: newRole });
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for user role:', err.message);
    }

    const idx = SEED_USERS.findIndex((u) => u.userId === targetUserId);
    if (idx !== -1) SEED_USERS[idx].role = newRole;

    await this.recordAdminAuditLog(session, 'UPDATE_USER_ROLE', {
      targetType: 'USER',
      targetId: targetUserId,
      previousValue: oldRole,
      newValue: newRole,
      result: 'SUCCESS',
      reason,
    });

    return updatedUser;
  }

  public async assignCommunityManagerScope(
    session: UserSession,
    targetUserId: string,
    communityId: string,
    reason: string = 'Assigned Community Manager role'
  ): Promise<AdminUserRecord> {
    assertSystemAdmin(session);

    const updatedUser = await this.updateUserRole(session, targetUserId, 'community_manager' as any, reason);

    try {
      await set(ref(rtdb, `communityMembers/${communityId}/${targetUserId}`), {
        role: 'community_manager',
        status: 'active',
        assignedBy: session.userId,
        assignedAt: Date.now(),
      });
      await set(ref(rtdb, `users/${targetUserId}/communityIds/${communityId}`), true);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for community manager scope:', err.message);
    }

    await this.recordAdminAuditLog(session, 'ASSIGN_COMMUNITY_MANAGER', {
      targetType: 'COMMUNITY_MANAGER',
      targetId: targetUserId,
      communityId,
      result: 'SUCCESS',
      reason,
    });

    return updatedUser;
  }

  public async assignAuthorityScope(
    session: UserSession,
    targetUserId: string,
    authorityOrganizationId: string,
    reason: string = 'Assigned Authority role'
  ): Promise<AdminUserRecord> {
    assertSystemAdmin(session);

    const updatedUser = await this.updateUserRole(session, targetUserId, 'authority' as any, reason);

    try {
      await set(ref(rtdb, `authorityAssignments/${authorityOrganizationId}/${targetUserId}`), {
        role: 'authority',
        organizationId: authorityOrganizationId,
        assignedBy: session.userId,
        assignedAt: Date.now(),
      });
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for authority scope:', err.message);
    }

    await this.recordAdminAuditLog(session, 'ASSIGN_AUTHORITY', {
      targetType: 'AUTHORITY',
      targetId: targetUserId,
      authorityOrganizationId,
      result: 'SUCCESS',
      reason,
    });

    return updatedUser;
  }

  public async setUserSuspended(
    session: UserSession,
    targetUserId: string,
    suspended: boolean,
    reason: string = 'Administrative review'
  ): Promise<AdminUserRecord> {
    assertSystemAdmin(session);

    const users = await this.getUsers(session);
    const targetUser = users.find((u) => u.userId === targetUserId);

    if (!targetUser) {
      throw new Error(`NOT_FOUND: User ${targetUserId} does not exist.`);
    }

    const newStatus: AdminUserRecord['accountStatus'] = suspended ? 'SUSPENDED' : 'ACTIVE';
    const updatedUser: AdminUserRecord = {
      ...targetUser,
      accountStatus: newStatus,
      suspensionReason: suspended ? reason : undefined,
    };

    try {
      await update(ref(rtdb, `adminUsers/${targetUserId}`), {
        accountStatus: newStatus,
        suspensionReason: suspended ? reason : null,
      });
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for suspension:', err.message);
    }

    const idx = SEED_USERS.findIndex((u) => u.userId === targetUserId);
    if (idx !== -1) {
      SEED_USERS[idx].accountStatus = newStatus;
      SEED_USERS[idx].suspensionReason = suspended ? reason : undefined;
    }

    await this.recordAdminAuditLog(session, suspended ? 'SUSPEND_USER' : 'REACTIVATE_USER', {
      targetUserId,
      reason,
    });

    return updatedUser;
  }

  // --- 2. COMMUNITY MANAGEMENT ---

  public async getCommunities(session: UserSession): Promise<AdminCommunityRecord[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'adminCommunities'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for communities:', err.message);
    }
    return SEED_COMMUNITIES;
  }

  public async createCommunity(
    session: UserSession,
    data: { name: string; region: string; description: string }
  ): Promise<AdminCommunityRecord> {
    assertSystemAdmin(session);

    const id = `comm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newCommunity: AdminCommunityRecord = {
      id,
      name: data.name,
      region: data.region,
      description: data.description,
      status: 'ACTIVE',
      memberCount: 1,
      createdAt: Date.now(),
      leaderPseudonymId: session.pseudonymId || `admin_${session.userId}`,
      pendingMembers: [],
    };

    try {
      await set(ref(rtdb, `adminCommunities/${id}`), newCommunity);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for create community:', err.message);
    }

    SEED_COMMUNITIES.push(newCommunity);

    await this.recordAdminAuditLog(session, 'CREATE_COMMUNITY', { communityId: id, name: data.name });
    return newCommunity;
  }

  public async updateCommunityStatus(
    session: UserSession,
    communityId: string,
    status: AdminCommunityRecord['status']
  ): Promise<AdminCommunityRecord> {
    assertSystemAdmin(session);

    const list = await this.getCommunities(session);
    const comm = list.find((c) => c.id === communityId);

    if (!comm) {
      throw new Error(`NOT_FOUND: Community ${communityId} not found.`);
    }

    const updated: AdminCommunityRecord = { ...comm, status };

    try {
      await update(ref(rtdb, `adminCommunities/${communityId}`), { status });
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for community status:', err.message);
    }

    const idx = SEED_COMMUNITIES.findIndex((c) => c.id === communityId);
    if (idx !== -1) SEED_COMMUNITIES[idx].status = status;

    await this.recordAdminAuditLog(session, 'UPDATE_COMMUNITY_STATUS', { communityId, status });
    return updated;
  }

  public async moderateCommunityMember(
    session: UserSession,
    communityId: string,
    memberId: string,
    action: 'APPROVE' | 'REJECT' | 'REMOVE'
  ): Promise<AdminCommunityRecord> {
    assertSystemAdmin(session);

    const list = await this.getCommunities(session);
    const comm = list.find((c) => c.id === communityId);

    if (!comm) {
      throw new Error(`NOT_FOUND: Community ${communityId} not found.`);
    }

    let updatedPending = [...comm.pendingMembers];
    let memberCount = comm.memberCount;

    if (action === 'APPROVE') {
      updatedPending = updatedPending.filter((m) => m !== memberId);
      memberCount += 1;
    } else if (action === 'REJECT') {
      updatedPending = updatedPending.filter((m) => m !== memberId);
    } else if (action === 'REMOVE') {
      memberCount = Math.max(0, memberCount - 1);
    }

    const updated: AdminCommunityRecord = {
      ...comm,
      pendingMembers: updatedPending,
      memberCount,
    };

    try {
      await set(ref(rtdb, `adminCommunities/${communityId}`), updated);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for member moderation:', err.message);
    }

    const idx = SEED_COMMUNITIES.findIndex((c) => c.id === communityId);
    if (idx !== -1) {
      SEED_COMMUNITIES[idx].pendingMembers = updatedPending;
      SEED_COMMUNITIES[idx].memberCount = memberCount;
    }

    await this.recordAdminAuditLog(session, 'MODERATE_COMMUNITY_MEMBER', { communityId, memberId, action });
    return updated;
  }

  // --- 3. INCIDENT & MODERATION MANAGEMENT ---

  public async getIncidents(session: UserSession): Promise<AdminIncidentRecord[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'incidents'));
      if (snapshot.exists()) {
        const rawMap = snapshot.val();
        return Object.keys(rawMap).map((key) => {
          const item = rawMap[key];
          return {
            id: item.id || key,
            title: item.title || 'Untitled Incident',
            description: item.description || '',
            dangerLevel: item.dangerLevel || item.severity || 'LOW',
            category: item.category || 'EMERGENCY_OTHER',
            communityId: item.communityId || 'comm_central',
            reporterPseudonymId: item.reporterPseudonymId || 'anonymized_hash_user',
            moderationStatus: item.moderationStatus || 'APPROVED',
            abuseReportsCount: item.abuseReportsCount || 0,
            authorityNotificationStatus: item.authorityNotificationStatus || 'NONE',
            createdAt: item.createdAt || Date.now(),
            reviewNotes: item.reviewNotes,
          };
        });
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for incidents:', err.message);
    }
    return SEED_INCIDENTS;
  }

  public async updateIncidentModerationStatus(
    session: UserSession,
    incidentId: string,
    moderationStatus: ModerationStatus,
    notes?: string
  ): Promise<AdminIncidentRecord> {
    assertSystemAdmin(session);

    const incidents = await this.getIncidents(session);
    const incident = incidents.find((i) => i.id === incidentId);

    if (!incident) {
      throw new Error(`NOT_FOUND: Incident ${incidentId} not found.`);
    }

    const updated: AdminIncidentRecord = {
      ...incident,
      moderationStatus,
      reviewNotes: notes || incident.reviewNotes,
    };

    try {
      await update(ref(rtdb, `incidents/${incidentId}`), {
        moderationStatus,
        reviewNotes: notes || null,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for incident moderation:', err.message);
    }

    const idx = SEED_INCIDENTS.findIndex((i) => i.id === incidentId);
    if (idx !== -1) {
      SEED_INCIDENTS[idx].moderationStatus = moderationStatus;
      if (notes) SEED_INCIDENTS[idx].reviewNotes = notes;
    }

    await this.recordAdminAuditLog(session, 'UPDATE_INCIDENT_MODERATION', { incidentId, moderationStatus, notes });
    return updated;
  }

  public async investigateAbuseReport(
    session: UserSession,
    reportId: string,
    action: 'DISMISS' | 'FLAG_INCIDENT' | 'SUSPEND_REPORTER'
  ): Promise<void> {
    assertSystemAdmin(session);
    await this.recordAdminAuditLog(session, 'INVESTIGATE_ABUSE_REPORT', { reportId, action });
  }

  // --- 4. AUTHORITY INTEGRATIONS MANAGEMENT ---

  public async getAuthorityProviders(session: UserSession): Promise<AuthorityProviderConfig[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'authorityProviders'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for providers:', err.message);
    }
    return SEED_AUTHORITY_PROVIDERS;
  }

  public async configureAuthorityProvider(
    session: UserSession,
    providerId: string,
    config: Partial<AuthorityProviderConfig>
  ): Promise<AuthorityProviderConfig> {
    assertSystemAdmin(session);

    const list = await this.getAuthorityProviders(session);
    const prov = list.find((p) => p.id === providerId);

    if (!prov) {
      throw new Error(`NOT_FOUND: Authority provider ${providerId} not found.`);
    }

    const updated: AuthorityProviderConfig = {
      ...prov,
      ...config,
    };

    try {
      await set(ref(rtdb, `authorityProviders/${providerId}`), updated);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for provider config:', err.message);
    }

    const idx = SEED_AUTHORITY_PROVIDERS.findIndex((p) => p.id === providerId);
    if (idx !== -1) {
      SEED_AUTHORITY_PROVIDERS[idx] = updated;
    }

    await this.recordAdminAuditLog(session, 'CONFIGURE_AUTHORITY_PROVIDER', { providerId, config });
    return updated;
  }

  // --- 5. CONTENT & CAMPAIGNS ---

  public async getEducationalTips(session: UserSession): Promise<EducationalTip[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'educationalTips'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for educational tips:', err.message);
    }
    return PRE_SEEDED_TIPS;
  }

  public async saveEducationalTip(
    session: UserSession,
    tip: EducationalTip
  ): Promise<EducationalTip> {
    assertSystemAdmin(session);
    const updatedTip = { ...tip, updatedAt: Date.now() };

    try {
      await set(ref(rtdb, `educationalTips/${tip.id}`), updatedTip);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for educational tip:', err.message);
    }

    await this.recordAdminAuditLog(session, 'SAVE_EDUCATIONAL_TIP', { tipId: tip.id, title: tip.title });
    return updatedTip;
  }

  public async deleteEducationalTip(session: UserSession, tipId: string): Promise<void> {
    assertSystemAdmin(session);
    try {
      await remove(ref(rtdb, `educationalTips/${tipId}`));
    } catch (err: any) {
      console.warn('[AdminService] RTDB remove fallback for educational tip:', err.message);
    }
    await this.recordAdminAuditLog(session, 'DELETE_EDUCATIONAL_TIP', { tipId });
  }

  public async updateCampaignStatus(
    session: UserSession,
    campaignId: string,
    status: CampaignStatus
  ): Promise<void> {
    assertSystemAdmin(session);
    try {
      await update(ref(rtdb, `campaigns/${campaignId}`), { status, updatedAt: Date.now() });
    } catch (err: any) {
      console.warn('[AdminService] RTDB update fallback for campaign status:', err.message);
    }
    await this.recordAdminAuditLog(session, 'UPDATE_CAMPAIGN_STATUS', { campaignId, status });
  }

  // --- 6. BADGES ADMINISTRATION & REVOCATION ---

  public async getBadgeDefinitions(session: UserSession): Promise<BadgeDefinition[]> {
    assertSystemAdmin(session);
    return ALL_BADGE_DEFINITIONS;
  }

  public async getBadgeAwards(session: UserSession): Promise<UserBadgeAward[]> {
    assertSystemAdmin(session);
    try {
      const snapshot = await get(ref(rtdb, 'userBadges'));
      if (snapshot.exists()) {
        const allAwards: UserBadgeAward[] = [];
        const rawMap = snapshot.val();
        Object.keys(rawMap).forEach((userId) => {
          const awardsMap = rawMap[userId];
          Object.values(awardsMap).forEach((aw: any) => allAwards.push(aw));
        });
        return allAwards;
      }
    } catch (err: any) {
      console.warn('[AdminService] RTDB read fallback for badge awards:', err.message);
    }
    return [];
  }

  /**
   * MANDATE: Revoke fraudulent awards with SHA-256 digital signature audit trail.
   */
  public async revokeBadgeAward(
    session: UserSession,
    targetUserId: string,
    awardId: string,
    reason: string
  ): Promise<BadgeRevocationAuditLog> {
    assertSystemAdmin(session);

    if (!reason || reason.trim().length < 5) {
      throw new Error('INVALID_INPUT: A detailed reason (min 5 chars) is required for badge revocation.');
    }

    const now = Date.now();
    const logId = `revoke_${now}_${crypto.randomBytes(4).toString('hex')}`;

    // Generate SHA-256 payload hash
    const payloadString = JSON.stringify({
      logId,
      targetUserId,
      awardId,
      revokedByAdminId: session.userId || 'system_admin',
      reason,
      revokedAt: now,
    });
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    const auditLog: BadgeRevocationAuditLog = {
      logId,
      revokedAt: now,
      userId: targetUserId,
      awardId,
      badgeId: awardId.split('_').slice(2).join('_') || 'unknown_badge',
      revokedByAdminId: session.userId || 'system_admin',
      reason,
      payloadHash,
    };

    // Remove award from user badges in RTDB
    try {
      await remove(ref(rtdb, `userBadges/${targetUserId}/${awardId}`));
      await set(ref(rtdb, `badgeRevocationAuditLogs/${logId}`), auditLog);
    } catch (err: any) {
      console.warn('[AdminService] RTDB revocation write fallback:', err.message);
    }

    await this.recordAdminAuditLog(session, 'REVOKE_BADGE_AWARD', { targetUserId, awardId, reason, payloadHash });
    return auditLog;
  }

  // --- 7. AGGREGATE ANALYTICS ---

  public async getAggregateAnalytics(session: UserSession): Promise<AggregateAnalytics> {
    assertSystemAdmin(session);

    const incidents = await this.getIncidents(session);
    const users = await this.getUsers(session);
    const communities = await this.getCommunities(session);
    const badgeAwards = await this.getBadgeAwards(session);

    const dangerCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    incidents.forEach((inc) => {
      const level = inc.dangerLevel === 'HIGH' ? 'HIGH' : inc.dangerLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW';
      dangerCounts[level]++;
    });

    const responseStatusCounts = { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 };
    incidents.forEach((inc) => {
      if (inc.authorityNotificationStatus && inc.authorityNotificationStatus !== 'NONE') {
        responseStatusCounts[inc.authorityNotificationStatus]++;
      }
    });

    let revokedCount = 0;
    try {
      const snapshot = await get(ref(rtdb, 'badgeRevocationAuditLogs'));
      if (snapshot.exists()) {
        revokedCount = Object.keys(snapshot.val()).length;
      }
    } catch (err: any) {
      // Fallback
    }

    return {
      totalIncidents: incidents.length,
      incidentsByDangerLevel: dangerCounts,
      totalCommunities: communities.length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.accountStatus === 'ACTIVE').length,
      responseStatuses: responseStatusCounts,
      campaignParticipation: 245,
      totalBadgeAwards: badgeAwards.length,
      revokedBadgeCount: revokedCount,
    };
  }

  // --- AUDIT TRAIL LOGGING ---

  private async recordAdminAuditLog(
    session: UserSession,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    const timestamp = Date.now();
    const logId = `admin_log_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = {
      logId,
      action,
      adminUserId: session.userId || 'system_admin',
      adminRole: session.role,
      details,
      timestamp,
    };

    try {
      await set(ref(rtdb, `adminAuditLogs/${logId}`), entry);
    } catch (err: any) {
      console.warn('[AdminService] RTDB write fallback for admin audit log:', err.message);
    }
  }
}
