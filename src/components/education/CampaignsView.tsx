'use client';

import React, { useState, useEffect } from 'react';
import { CommunityCampaign } from '@/lib/education/types';
import { subscribeToCampaigns } from '@/lib/firebase/rtdb';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Megaphone,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  Target,
  Sparkles,
  Video,
  Lock,
  ExternalLink,
  Award,
  Bell,
  AlertCircle,
} from 'lucide-react';

interface CampaignsViewProps {
  userSession?: any;
  onCampaignJoined?: (campaign: CommunityCampaign) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  userSession,
  onCampaignJoined,
}) => {
  const [campaigns, setCampaigns] = useState<CommunityCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  // Award & Updates Modal state after joining meeting
  const [joinedModalCampaign, setJoinedModalCampaign] = useState<{
    campaign: CommunityCampaign;
    badgeName: string;
  } | null>(null);

  // New Campaign Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/antijj-safety-drive');
  const [badgeRewardName, setBadgeRewardName] = useState('Community Guardian');
  const [organizerLabel, setOrganizerLabel] = useState('Neighborhood Safety Leader');

  const activeUserId = userSession?.userId || 'user_demo_101';
  const isAuthenticated = Boolean(userSession?.isAuthenticated);
  const isCommunityManager =
    isAuthenticated &&
    (userSession?.role === 'VERIFIED_COMMUNITY_LEADER' || userSession?.role === 'SYSTEM_ADMIN');

  useEffect(() => {
    setLoading(true);

    // Initial API fallback fetch
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) {
          setCampaigns(data.campaigns);
        }
      })
      .catch((err) => console.warn('API campaigns fetch fallback error:', err))
      .finally(() => setLoading(false));

    // Subscribe to live Realtime Database campaign updates
    const unsubscribe = subscribeToCampaigns((liveList) => {
      if (liveList && liveList.length > 0) {
        setCampaigns(liveList);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleJoinCampaign = async (campaign: CommunityCampaign) => {
    setJoiningId(campaign.id);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(userSession),
        },
        body: JSON.stringify({
          action: 'JOIN',
          campaignId: campaign.id,
          userId: activeUserId,
        }),
      });

      const data = await res.json();
      if (data.campaign) {
        const updatedCamp = data.campaign as CommunityCampaign;
        setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updatedCamp : c)));

        // Open Meeting URL in new browser tab
        const urlToOpen = updatedCamp.meetingUrl || campaign.meetingUrl || 'https://meet.google.com/antijj-safety-drive';
        if (typeof window !== 'undefined') {
          window.open(urlToOpen, '_blank', 'noopener,noreferrer');
        }

        // Call backend badge engine to evaluate eligibility for campaign participation
        try {
          await fetch('/api/badges/evaluate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-session': JSON.stringify(userSession),
            },
            body: JSON.stringify({
              session: userSession,
              targetUserId: activeUserId,
              mockVerifiedEvents: [
                {
                  eventId: `ev_join_${Date.now()}`,
                  userId: activeUserId,
                  eventType: 'CAMPAIGN_PARTICIPATION',
                  referenceId: campaign.id,
                  timestamp: Date.now(),
                  verifiedByActorId: 'campaign_leader_verifier',
                },
              ],
            }),
          });
        } catch (e) {}

        // Show Confirmation & Badge Award Modal
        setJoinedModalCampaign({
          campaign: updatedCamp,
          badgeName: data.badgeName || updatedCamp.badgeRewardName || 'Community Guardian',
        });

        if (onCampaignJoined) {
          onCampaignJoined(updatedCamp);
        }
      }
    } catch (err) {
      console.warn('Error joining campaign:', err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateCampaign = async () => {
    if (!title.trim() || !description.trim()) return;

    if (!isCommunityManager) {
      setPermError('AUTHENTICATION_REQUIRED: You must be authenticated as a Verified Community Manager to launch campaigns.');
      return;
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(userSession),
        },
        body: JSON.stringify({
          action: 'CREATE',
          userId: activeUserId,
          campaign: {
            title,
            description,
            meetingUrl: meetingUrl.trim() || 'https://meet.google.com/antijj-safety-drive',
            badgeRewardName: badgeRewardName.trim() || 'Community Guardian',
            organizerLabel: organizerLabel || 'Verified Community Leader',
            communityId: userSession?.communityIds?.[0] || 'comm_central',
            communityName: 'Downtown Central District',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setPermError(data.message || data.error || 'Permission denied when creating campaign');
        return;
      }

      if (data.campaign) {
        setCampaigns((prev) => [data.campaign, ...prev]);

        // Evaluate badge for organizing a campaign
        await fetch('/api/badges/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-session': JSON.stringify(userSession),
          },
          body: JSON.stringify({
            session: userSession,
            targetUserId: activeUserId,
            mockVerifiedEvents: [
              {
                eventId: `ev_org_${Date.now()}`,
                userId: activeUserId,
                eventType: 'CAMPAIGN_ORGANIZED_COMPLETED',
                referenceId: data.campaign.id,
                timestamp: Date.now(),
                verifiedByActorId: 'system_community_admin',
              },
            ],
          }),
        });
      }
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setPermError(null);
    } catch (err: any) {
      setPermError(err.message || 'Error creating campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-purple-500/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-purple-300 border-purple-400/50">
              COMMUNITY MOBILIZATION
            </Badge>
            <span className="text-xs text-purple-200 font-semibold">Educational Campaigns</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Organize & Join Anti-Jungle Justice Awareness Campaigns
          </h2>
          <p className="text-xs text-purple-200/80 max-w-xl">
            Mobilize neighbors, conduct transit corridor safety walks, and educate shopkeepers on calling 112 instead of resorting to extrajudicial violence.
          </p>
        </div>

        {isCommunityManager ? (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setPermError(null);
              setIsCreating(true);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-lg"
          >
            Launch Campaign
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Button
              variant="outline"
              disabled
              icon={<Lock className="w-4 h-4 text-amber-400" />}
              className="border-slate-700 text-slate-400 opacity-80 cursor-not-allowed"
            >
              Launch Campaign (Manager Required)
            </Button>
            <span className="text-[10px] text-amber-400/90 font-mono">
              Requires VERIFIED_COMMUNITY_LEADER role
            </span>
          </div>
        )}
      </div>

      {/* Permission Warning Banner if any */}
      {permError && (
        <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{permError}</div>
          <button onClick={() => setPermError(null)} className="text-red-400 hover:text-red-200">
            &times;
          </button>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((camp) => {
          const participantList = camp.participantIds || [];
          const isJoined = participantList.includes(activeUserId);
          const isCompleted = camp.status === 'COMPLETED';
          const participantCount = camp.metrics?.participantCount || participantList.length;

          return (
            <Card
              key={camp.id}
              hoverable
              className={`bg-slate-900/90 border ${
                isCompleted ? 'border-slate-800' : 'border-purple-500/40'
              } flex flex-col justify-between transition-all duration-300 shadow-lg`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-purple-400">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isCompleted ? 'outline' : 'info'}
                            className="text-[10px]"
                          >
                            {camp.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {camp.communityName || 'Downtown Central'}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-white mt-1">
                          {camp.title}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {camp.description}
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Organizer:</span>
                      <span className="text-purple-300 font-semibold">{camp.organizerLabel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-mono">Duration:</span>
                      <span className="text-slate-300 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {new Date(camp.startDate || Date.now()).toLocaleDateString()} -{' '}
                        {new Date(camp.endDate || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {camp.meetingUrl && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                        <span className="text-slate-500 font-mono">Virtual Meeting:</span>
                        <span className="text-sky-400 font-mono flex items-center gap-1 text-[10px] truncate max-w-[180px]">
                          <Video className="w-3 h-3 text-sky-400" />
                          {camp.meetingUrl}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Campaign Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/30">
                      <div className="text-base font-black font-mono text-purple-300">
                        {participantCount}
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                        <Users className="w-2.5 h-2.5 text-purple-400" /> Joined
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-base font-black font-mono text-sky-300">
                        {camp.metrics?.reachCount || participantCount * 5}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Reach
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-base font-black font-mono text-emerald-300">
                        {camp.metrics?.verifiedActionsCount || 10}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                        <Target className="w-2.5 h-2.5" /> Actions
                      </div>
                    </div>
                  </div>

                  {/* Latest Update Banner */}
                  {camp.updates && camp.updates.length > 0 && (
                    <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-xs text-purple-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                        <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Latest Update from Organizer:</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "{camp.updates[0].message}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-amber-300 font-semibold">
                    Earns: {camp.badgeRewardName || 'Community Guardian'}
                  </span>
                </div>

                <Button
                  variant={isJoined ? 'outline' : 'primary'}
                  size="sm"
                  disabled={isCompleted || joiningId === camp.id}
                  icon={
                    isJoined ? (
                      <Video className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )
                  }
                  onClick={() => handleJoinCampaign(camp)}
                  className={
                    isJoined
                      ? 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/40'
                      : 'bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg'
                  }
                >
                  {joiningId === camp.id
                    ? 'Joining...'
                    : isJoined
                    ? 'Join Meeting (Active)'
                    : 'Join Meeting'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Campaign Launch Modal (Community Leaders) */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                Launch Educational Campaign
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Campaign Title:</label>
                <input
                  type="text"
                  placeholder="e.g., Transit Hub Anti-Jungle Justice Awareness Drive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Organizer / Council Name:</label>
                <input
                  type="text"
                  placeholder="e.g., Central District Peace Council"
                  value={organizerLabel}
                  onChange={(e) => setOrganizerLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Virtual Meeting URL / Link:</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-123"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sky-400 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Reward Badge Name:</label>
                <input
                  type="text"
                  placeholder="e.g., Community Guardian"
                  value={badgeRewardName}
                  onChange={(e) => setBadgeRewardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Description & Safety Objectives:</label>
                <textarea
                  rows={3}
                  placeholder="Explain campaign activities, target location, and educational goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 font-sans text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCampaign}
                disabled={!title.trim() || !description.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                Publish Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Badge Awarded Modal */}
      {joinedModalCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Joined Campaign & Badge Unlocked!</h3>
              <p className="text-xs text-slate-300">
                You have successfully joined <strong className="text-purple-300">{joinedModalCampaign.campaign.title}</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-2">
              <span className="text-[11px] uppercase font-mono text-amber-400 font-bold block">
                Verified Badge Reward Granted
              </span>
              <div className="text-base font-black text-amber-300 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {joinedModalCampaign.badgeName}
              </div>
              <p className="text-[11px] text-slate-400">
                Recorded in Firebase Realtime Database & added to your verified profile badges.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1 text-xs">
              <span className="font-bold text-sky-400 block text-[11px]">Meeting Status:</span>
              <p className="text-slate-300 text-[11px]">
                The virtual meeting room has been launched in your browser:
              </p>
              <a
                href={joinedModalCampaign.campaign.meetingUrl || 'https://meet.google.com/antijj-safety-drive'}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 underline font-mono text-[11px] break-all block"
              >
                {joinedModalCampaign.campaign.meetingUrl || 'https://meet.google.com/antijj-safety-drive'}
              </a>
            </div>

            <Button
              variant="primary"
              onClick={() => setJoinedModalCampaign(null)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Continue to Campaign Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

