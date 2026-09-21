'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  AlertTriangle,
  Radio,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  UserCheck,
  Plus,
  RefreshCw,
  Eye,
  FileText,
  Search,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { UserSession } from '@/lib/auth';
import {
  AdminUserRecord,
  AdminCommunityRecord,
  AdminIncidentRecord,
  AuthorityProviderConfig,
  AggregateAnalytics,
  BadgeRevocationAuditLog,
} from '@/lib/adminService';
import { EducationalTip, BadgeDefinition, UserBadgeAward } from '@/lib/education/types';
import { useTranslation } from '@/lib/i18n/context';

interface AdminDashboardProps {
  session: UserSession;
}

type AdminTab =
  | 'ANALYTICS'
  | 'USERS'
  | 'COMMUNITIES'
  | 'INCIDENTS'
  | 'AUTHORITY'
  | 'CONTENT'
  | 'BADGES';

export function AdminDashboard({ session }: AdminDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('ANALYTICS');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Analytics Data
  const [analytics, setAnalytics] = useState<AggregateAnalytics | null>(null);

  // Tab Data States
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [communities, setCommunities] = useState<AdminCommunityRecord[]>([]);
  const [incidents, setIncidents] = useState<AdminIncidentRecord[]>([]);
  const [providers, setProviders] = useState<AuthorityProviderConfig[]>([]);
  const [tips, setTips] = useState<EducationalTip[]>([]);
  const [badgeDefs, setBadgeDefs] = useState<BadgeDefinition[]>([]);
  const [badgeAwards, setBadgeAwards] = useState<UserBadgeAward[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modal / Action States
  const [selectedUserForRevoke, setSelectedUserForRevoke] = useState<{ userId: string; awardId: string } | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revocationLog, setRevocationLog] = useState<BadgeRevocationAuditLog | null>(null);

  // New Community Form State
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommRegion, setNewCommRegion] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { 'x-user-session': JSON.stringify(session) };

      const [resAnalytics, resUsers, resComms, resIncs, resProvs, resBadges] = await Promise.all([
        fetch('/api/admin?action=analytics', { headers }),
        fetch('/api/admin?action=users', { headers }),
        fetch('/api/admin/communities', { headers }),
        fetch('/api/admin/incidents', { headers }),
        fetch('/api/admin/authority', { headers }),
        fetch('/api/admin/badges?type=awards', { headers }),
      ]);

      const dataAnalytics = await resAnalytics.json();
      const dataUsers = await resUsers.json();
      const dataComms = await resComms.json();
      const dataIncs = await resIncs.json();
      const dataProvs = await resProvs.json();
      const dataBadges = await resBadges.json();

      if (!resAnalytics.ok || !resUsers.ok) {
        throw new Error(dataAnalytics.error || dataUsers.error || 'Failed to authorize administrative request');
      }

      setAnalytics(dataAnalytics.analytics);
      setUsers(dataUsers.users || []);
      setCommunities(dataComms.communities || []);
      setIncidents(dataIncs.incidents || []);
      setProviders(dataProvs.providers || []);
      setBadgeAwards(dataBadges.awards || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading administration data');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // User Actions
  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({ action: 'update_role', targetUserId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Updated user role to ${newRole}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleSuspend = async (targetUserId: string, currentlySuspended: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({
          action: 'set_suspended',
          targetUserId,
          suspended: !currentlySuspended,
          reason: currentlySuspended ? 'Reactivated by Admin' : 'Suspended for safety policy review',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`User ${currentlySuspended ? 'reactivated' : 'suspended'} successfully`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Community Creation
  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({ name: newCommName, region: newCommRegion, description: newCommDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Created community: ${newCommName}`);
      setShowNewCommunityModal(false);
      setNewCommName('');
      setNewCommRegion('');
      setNewCommDesc('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Incident Moderation Update
  const handleIncidentModeration = async (incidentId: string, moderationStatus: string) => {
    try {
      const res = await fetch('/api/admin/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({ action: 'update_moderation', incidentId, moderationStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Updated incident moderation to ${moderationStatus}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Provider Toggle
  const handleToggleProvider = async (providerId: string, isEnabled: boolean) => {
    try {
      const res = await fetch('/api/admin/authority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({ providerId, config: { isEnabled: !isEnabled } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Authority provider status updated`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Revoke Badge Award
  const handleRevokeBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRevoke) return;

    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({
          action: 'revoke',
          targetUserId: selectedUserForRevoke.userId,
          awardId: selectedUserForRevoke.awardId,
          reason: revokeReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRevocationLog(data.auditLog);
      showToast('Badge award revoked with SHA-256 audit log');
      setSelectedUserForRevoke(null);
      setRevokeReason('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (!session.isAuthenticated || session.role !== 'SYSTEM_ADMIN') {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-2xl backdrop-blur-md text-red-200">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Access Denied: SYSTEM_ADMIN Required</h2>
          <p className="text-sm text-red-300/80">
            You do not have administrative credentials to view the Commus System Control Panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-amber-500/30 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/40">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-wide">Commus System Administration</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                System Admin
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Role-based management, community moderation, incident oversight & audit governance
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          Refresh Control Panel
        </button>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-sm flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm">
        {[
          { id: 'ANALYTICS', label: 'Analytics & Overview', icon: TrendingUp },
          { id: 'USERS', label: 'Users & Roles', icon: Users },
          { id: 'COMMUNITIES', label: 'Communities', icon: Building2 },
          { id: 'INCIDENTS', label: 'Incidents & Moderation', icon: AlertTriangle },
          { id: 'AUTHORITY', label: 'Authority Providers', icon: Radio },
          { id: 'BADGES', label: 'Badges & Revocation', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS & OVERVIEW */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Incidents</div>
              <div className="text-3xl font-extrabold text-white">{analytics.totalIncidents}</div>
              <div className="text-xs text-amber-400/80 mt-1">Cross-community feed</div>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">High Danger Incidents</div>
              <div className="text-3xl font-extrabold text-red-400">{analytics.incidentsByDangerLevel.HIGH}</div>
              <div className="text-xs text-red-300/70 mt-1">Escalated to authorities</div>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Communities</div>
              <div className="text-3xl font-extrabold text-emerald-400">{analytics.totalCommunities}</div>
              <div className="text-xs text-emerald-300/70 mt-1">Verified safe zones</div>
            </div>

            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Registered Users</div>
              <div className="text-3xl font-extrabold text-sky-400">{analytics.totalUsers}</div>
              <div className="text-xs text-sky-300/70 mt-1">{analytics.activeUsers} Active Accounts</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Danger Level Distribution */}
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Incidents by Danger Level
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-red-400">HIGH Risk</span>
                    <span>{analytics.incidentsByDangerLevel.HIGH} incidents</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (analytics.incidentsByDangerLevel.HIGH / Math.max(1, analytics.totalIncidents)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-amber-400">MEDIUM Risk</span>
                    <span>{analytics.incidentsByDangerLevel.MEDIUM} incidents</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (analytics.incidentsByDangerLevel.MEDIUM / Math.max(1, analytics.totalIncidents)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-emerald-400">LOW Risk</span>
                    <span>{analytics.incidentsByDangerLevel.LOW} incidents</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (analytics.incidentsByDangerLevel.LOW / Math.max(1, analytics.totalIncidents)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Authority Delivery Metrics */}
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-400" />
                Authority Response Statuses
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400">DELIVERED</div>
                  <div className="text-2xl font-bold text-emerald-400">{analytics.responseStatuses.DELIVERED}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400">SENT</div>
                  <div className="text-2xl font-bold text-sky-400">{analytics.responseStatuses.SENT}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400">PENDING</div>
                  <div className="text-2xl font-bold text-amber-400">{analytics.responseStatuses.PENDING}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400">FAILED</div>
                  <div className="text-2xl font-bold text-red-400">{analytics.responseStatuses.FAILED}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === 'USERS' && (
        <div className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              User Account Directory & Role Management
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user, email or pseudonym..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Pseudonym ID</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.pseudonymId.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-amber-300/90">{u.pseudonymId}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.userId, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                        >
                          <option value="CITIZEN_MEMBER">CITIZEN_MEMBER</option>
                          <option value="VERIFIED_COMMUNITY_LEADER">VERIFIED_COMMUNITY_LEADER</option>
                          <option value="AUTHORITY_DISPATCHER">AUTHORITY_DISPATCHER</option>
                          <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {u.accountStatus === 'ACTIVE' ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleSuspend(u.userId, u.accountStatus === 'SUSPENDED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            u.accountStatus === 'SUSPENDED'
                              ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {u.accountStatus === 'SUSPENDED' ? 'Reactivate' : 'Suspend Account'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNITIES */}
      {activeTab === 'COMMUNITIES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Community Network Management
            </h2>
            <button
              onClick={() => setShowNewCommunityModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create New Community
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((c) => (
              <div key={c.id} className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{c.name}</h3>
                    <p className="text-xs text-amber-400 font-medium">{c.region}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{c.description}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.memberCount} Members</span>
                  <span className="font-mono text-slate-400">Leader: {c.leaderPseudonymId}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Modal */}
          {showNewCommunityModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateCommunity}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white">Create New Safe Community</h3>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Community Name</label>
                  <input
                    type="text"
                    required
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kaduna Peace Alliance"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Geographic Region</label>
                  <input
                    type="text"
                    required
                    value={newCommRegion}
                    onChange={(e) => setNewCommRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Kaduna Central"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="De-escalation and neighborhood safety monitoring..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCommunityModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl"
                  >
                    Create Community
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INCIDENTS & MODERATION */}
      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Incident Oversight & Moderation Queue
          </h2>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        inc.dangerLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {inc.dangerLevel} RISK
                    </span>
                    <h3 className="font-bold text-white text-base">{inc.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300">{inc.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>Category: {inc.category}</span>
                    <span>•</span>
                    <span className="font-mono text-amber-300/80">Reporter: {inc.reporterPseudonymId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleIncidentModeration(inc.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleIncidentModeration(inc.id, 'FLAGGED')}
                    className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg"
                  >
                    Flag
                  </button>
                  <button
                    onClick={() => handleIncidentModeration(inc.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUTHORITY PROVIDERS */}
      {activeTab === 'AUTHORITY' && (
        <div className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400" />
            Authority Integration Gateways & Provider Control
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="p-5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <p className="text-xs text-sky-300 font-mono mt-0.5">{p.endpointUrl}</p>
                  </div>
                  <button
                    onClick={() => handleToggleProvider(p.id, p.isEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      p.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {p.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                  <span>Type: {p.type}</span>
                  <span>Max Retries: {p.retryLimit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BADGES & REVOCATION */}
      {activeTab === 'BADGES' && (
        <div className="space-y-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Badge Award Governance & Fraudulent Revocation
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Award ID</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Awarded Date</th>
                  <th className="py-3 px-4 text-right">Revocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {badgeAwards.map((aw) => (
                  <tr key={aw.awardId} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs text-amber-300">{aw.awardId}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">{aw.userId}</td>
                    <td className="py-3 px-4 font-bold text-white">{aw.badgeName}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(aw.awardedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedUserForRevoke({ userId: aw.userId, awardId: aw.awardId })}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg"
                      >
                        Revoke Award
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revoke Modal */}
          {selectedUserForRevoke && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleRevokeBadge}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-400" />
                  Revoke Fraudulent Badge Award
                </h3>
                <p className="text-xs text-slate-300">
                  Revoking award <code className="text-amber-300">{selectedUserForRevoke.awardId}</code> will write a signed SHA-256 digital audit record to <code className="text-amber-300">/badgeRevocationAuditLogs</code>.
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Mandatory Revocation Reason</label>
                  <textarea
                    required
                    minLength={5}
                    rows={3}
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                    placeholder="Explain why this award was flagged as unearned or fraudulent..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForRevoke(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl"
                  >
                    Confirm & Revoke
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
