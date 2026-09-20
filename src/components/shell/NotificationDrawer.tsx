'use client';

import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { DangerLevelIndicator } from '../ui/DangerLevelIndicator';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppNotification, NotificationPreferences } from '@/lib/notifications/types';
import { DEFAULT_PREFERENCES } from '@/lib/notifications/service';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Settings,
  Shield,
  Smartphone,
  Mail,
  MessageSquare,
  Award,
  Megaphone,
  Radio,
  Clock,
  Filter,
} from 'lucide-react';

const getMockInitialNotifications = (userId: string): AppNotification[] => [
  {
    id: 'notif_demo_1',
    recipientUserId: userId,
    eventType: 'HIGH_RISK_ALERT',
    title: 'HIGH-RISK ALERT: Main Transit Hub Bottleneck',
    message: 'High volume gathering reported near east exit gates causing physical congestion.',
    riskLevel: 'HIGH',
    referenceId: 'inc_101',
    communityId: 'comm_central',
    timestamp: Date.now() - 1000 * 60 * 10,
    isRead: false,
    deduplicationKey: `dedup_${userId}_101`,
    safetyDisclaimer: 'SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter.',
  },
  {
    id: 'notif_demo_2',
    recipientUserId: userId,
    eventType: 'BADGE_EARNED',
    title: 'Badge Unlocked: Bronze Safety Advocate',
    message: 'Congratulations! You earned the Bronze Safety Advocate badge for verified community participation.',
    riskLevel: 'LOW',
    referenceId: 'badge_tier_bronze',
    timestamp: Date.now() - 1000 * 60 * 45,
    isRead: false,
    deduplicationKey: `dedup_badge_${userId}`,
  },
  {
    id: 'notif_demo_3',
    recipientUserId: userId,
    eventType: 'AUTHORITY_RESPONSE',
    title: 'Authority Escalation Update',
    message: 'Nigeria Police Force (NPF) acknowledged dispatch request for Incident #inc_101.',
    riskLevel: 'MEDIUM',
    referenceId: 'esc_101',
    timestamp: Date.now() - 1000 * 60 * 120,
    isRead: true,
    readAt: Date.now() - 1000 * 60 * 60,
    deduplicationKey: `dedup_auth_${userId}`,
  },
];

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  userId = 'user_demo_101',
  onUnreadCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
        if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0);
      } else {
        const mockList = getMockInitialNotifications(userId);
        setNotifications(mockList);
        if (onUnreadCountChange) onUnreadCountChange(2);
      }
    } catch (err) {
      const mockList = getMockInitialNotifications(userId);
      setNotifications(mockList);
      if (onUnreadCountChange) onUnreadCountChange(2);
    } finally {
      setLoading(false);
    }
  }, [userId, onUnreadCountChange]);

  const fetchPreferences = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/preferences?userId=${userId}`);
      const data = await res.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {}
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen, fetchNotifications, fetchPreferences]);

  const handleMarkRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true, readAt: Date.now() } : n))
    );

    const newUnread = notifications.filter((n) => n.id !== notifId && !n.isRead).length;
    if (onUnreadCountChange) onUnreadCountChange(newUnread);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', notificationId: notifId, userId }),
      });
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: Date.now() }))
    );

    if (onUnreadCountChange) onUnreadCountChange(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ', userId }),
      });
    } catch (err) {}
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, userId }),
      });
      const data = await res.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.warn('Error saving preferences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filterUnreadOnly ? !n.isRead : true
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'HIGH_RISK_ALERT':
        return <Badge variant="danger" className="text-[9px]">HIGH RISK</Badge>;
      case 'BADGE_EARNED':
        return <Badge variant="outline" className="text-[9px] border-amber-500/80 text-amber-300">BADGE</Badge>;
      case 'AUTHORITY_RESPONSE':
        return <Badge variant="info" className="text-[9px]">AUTHORITY</Badge>;
      case 'CAMPAIGN_INVITATION':
        return <Badge variant="synthetic" className="text-[9px]">CAMPAIGN</Badge>;
      case 'MEMBERSHIP_APPROVED':
        return <Badge variant="success" className="text-[9px]">COMMUNITY</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">NOTICE</Badge>;
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Community Safety Notifications" position="right">
      <div className="flex flex-col gap-4">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notifications'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            Alerts ({unreadCount})
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preferences'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* Tab 1: Notifications Feed */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  filterUnreadOnly
                    ? 'bg-sky-950 text-sky-300 border-sky-600'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {filterUnreadOnly ? 'Unread Only' : 'All Alerts'}
              </button>

              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" icon={<CheckCheck className="w-4 h-4 text-emerald-400" />} onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
              )}
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
                No active notifications found.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                    notif.isRead
                      ? 'bg-slate-950/60 border-slate-900 opacity-75'
                      : 'bg-slate-900 border-slate-800 shadow-md ring-1 ring-sky-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                      {renderEventBadge(notif.eventType)}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{notif.title}</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                  {notif.safetyDisclaimer && (
                    <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-[11px] text-amber-200 font-medium">
                      ⚠️ {notif.safetyDisclaimer}
                    </div>
                  )}

                  <div className="flex items-center justify-end border-t border-slate-800/60 pt-2 mt-1">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Notification Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-5 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Shield className="w-4 h-4 text-sky-400" />
                Notification Channels
              </h4>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2 font-medium">
                    <Bell className="w-4 h-4 text-sky-400" /> In-App Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.channels.inAppEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, inAppEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2 font-medium">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Push Notifications (FCM)
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.channels.pushEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, pushEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2 font-medium">
                    <Mail className="w-4 h-4 text-amber-400" /> Email Digest
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.channels.emailEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, emailEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2 font-medium">
                    <MessageSquare className="w-4 h-4 text-purple-400" /> SMS Emergency Broadcast
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.channels.smsEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        channels: { ...preferences.channels, smsEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Filter className="w-4 h-4 text-amber-400" />
                Event Filters & Anti-Spam
              </h4>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-amber-300">High-Risk & Critical Only Filter</span>
                  <input
                    type="checkbox"
                    checked={preferences.eventTypes.highRiskOnly}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        eventTypes: { ...preferences.eventTypes, highRiskOnly: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Badge Unlocked Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.eventTypes.badgeEarnedEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        eventTypes: { ...preferences.eventTypes, badgeEarnedEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-purple-400" /> Campaign Invitations
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.eventTypes.campaignInvitationEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        eventTypes: { ...preferences.eventTypes, campaignInvitationEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-300 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-red-400" /> Authority Dispatch Responses
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.eventTypes.authorityResponseEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        eventTypes: { ...preferences.eventTypes, authorityResponseEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </label>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="w-full"
            >
              {savingPrefs ? 'Saving Settings...' : 'Save Notification Preferences'}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};
