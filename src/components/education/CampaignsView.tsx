'use client';

import React, { useState, useEffect } from 'react';
import { CommunityCampaign } from '@/lib/education/types';
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

  // New Campaign Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizerLabel, setOrganizerLabel] = useState('Neighborhood Safety Committee');

  const activeUserId = userSession?.userId || 'user_demo_101';

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.warn('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleJoinCampaign = async (campaignId: string) => {
    setJoiningId(campaignId);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          campaignId,
          userId: activeUserId,
        }),
      });

      const data = await res.json();
      if (data.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? data.campaign : c))
        );

        // Call backend badge engine to evaluate eligibility for campaign participation
        await fetch('/api/badges/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: userSession,
            targetUserId: activeUserId,
            mockVerifiedEvents: [
              {
                eventId: `ev_join_${Date.now()}`,
                userId: activeUserId,
                eventType: 'CAMPAIGN_PARTICIPATION',
                referenceId: campaignId,
                timestamp: Date.now(),
                verifiedByActorId: 'campaign_leader_verifier',
              },
            ],
          }),
        });

        if (onCampaignJoined) {
          onCampaignJoined(data.campaign);
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

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          userId: activeUserId,
          campaign: {
            title,
            description,
            organizerLabel: organizerLabel || 'Verified Community Member',
            communityId: 'comm_central',
            communityName: 'Downtown Central District',
          },
        }),
      });

      const data = await res.json();
      if (data.campaign) {
        setCampaigns([data.campaign, ...campaigns]);

        // Evaluate badge for organizing a campaign
        await fetch('/api/badges/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    } catch (err) {
      console.warn('Error creating campaign:', err);
    } finally {
      setIsCreating(false);
      setTitle('');
      setDescription('');
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

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
        >
          Launch Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((camp) => {
          const isJoined = camp.participantIds.includes(activeUserId);
          const isCompleted = camp.status === 'COMPLETED';

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
                            {camp.communityName}
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

                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Organizer:</span>
                      <span className="text-slate-200 font-medium">{camp.organizerLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono">Duration:</span>
                      <span className="text-slate-300 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {new Date(camp.startDate).toLocaleDateString()} -{' '}
                        {new Date(camp.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-sm font-black font-mono text-purple-300">
                        {camp.metrics.participantCount}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Participants
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-sm font-black font-mono text-sky-300">
                        {camp.metrics.reachCount}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Reach
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-sm font-black font-mono text-emerald-300">
                        {camp.metrics.verifiedActionsCount}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-center gap-1">
                        <Target className="w-2.5 h-2.5" /> Verified
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-slate-400">
                    Earns Campaign Leader / Participant Badge
                  </span>
                </div>

                <Button
                  variant={isJoined ? 'outline' : 'primary'}
                  size="sm"
                  disabled={isJoined || isCompleted || joiningId === camp.id}
                  icon={
                    isJoined ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )
                  }
                  onClick={() => handleJoinCampaign(camp.id)}
                >
                  {isJoined
                    ? 'Joined'
                    : isCompleted
                    ? 'Completed'
                    : joiningId === camp.id
                    ? 'Joining...'
                    : '1-Click Join'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Campaign Launch Modal */}
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
                <label className="text-slate-400 font-semibold block mb-1">Organizer Name / Committee:</label>
                <input
                  type="text"
                  placeholder="e.g., Central District Peace Volunteers"
                  value={organizerLabel}
                  onChange={(e) => setOrganizerLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Description & Goals:</label>
                <textarea
                  rows={4}
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
    </div>
  );
};
