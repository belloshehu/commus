'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  Share2,
  Copy,
  Check,
  Users,
  Award,
  ShieldCheck,
  Sparkles,
  UserPlus,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  getReferralStats,
  saveUserReferralCode,
  ReferralStats,
} from '@/lib/referrals';

interface ReferralSectionProps {
  userId: string;
  pseudonymId?: string;
  userEmail?: string;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  userId,
  pseudonymId,
  userEmail,
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (!userId) return;
    saveUserReferralCode(userId, pseudonymId);
    const data = getReferralStats(userId, pseudonymId);
    setStats(data);
  }, [userId, pseudonymId]);

  if (!stats) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(stats.referralLink);
      } else {
        // Fallback for non-secure context
        const textArea = document.createElement('textarea');
        textArea.value = stats.referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('[ReferralSection] Copy error:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join Commus Safety Network',
      text: 'Join me on Commus Community Safety Network to protect our neighborhood with real-time hazard alerts.',
      url: stats.referralLink,
    };

    if (typeof window !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (err) {
        // Share modal dismissed or unsupported
      }
    } else {
      // Fallback: Open WhatsApp share link
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${shareData.text}\n\nJoin link: ${stats.referralLink}`
      )}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const tierBadgeVariant = {
    'Guardian Champion': 'success',
    'Safety Sentinel': 'warning',
    'Community Advocate': 'info',
    'Safety Supporter': 'neutral',
  } as const;

  return (
    <Card variant="highlight" className="border-sky-800/60 bg-slate-900/90 shadow-xl">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-600/80 flex items-center justify-center text-sky-400 shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-white">
                  Community Referral & Network Growth
                </CardTitle>
                <Badge variant={tierBadgeVariant[stats.ambassadorTier]} className="text-[10px]">
                  {stats.ambassadorTier}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Invite friends and neighbors to join Commus to strengthen neighborhood safety.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400">Invited Members:</span>
            <strong className="text-sky-300 font-mono text-sm">{stats.totalInvitedCount}</strong>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Referral Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Your Unique Referral Link</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Code: <strong className="text-sky-300">{stats.referralCode}</strong>
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 overflow-hidden text-xs font-mono text-slate-200">
              <span className="truncate">{stats.referralLink}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant={isCopied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopyLink}
                icon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Link Copied!' : 'Copy Link'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                icon={<Share2 className="w-4 h-4 text-sky-400" />}
              >
                {isShared ? 'Shared' : 'Share'}
              </Button>
            </div>
          </div>
        </div>

        {/* Ambassador Tier Status Banner */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <span>Ambassador Rank: <strong className="text-amber-300">{stats.ambassadorTier}</strong></span>
              </div>
              <p className="text-[11px] text-slate-400">
                {stats.totalInvitedCount === 0
                  ? 'Invite your first neighbor to unlock the Community Advocate safety badge!'
                  : stats.totalInvitedCount < 5
                  ? `Invite ${5 - stats.totalInvitedCount} more members to unlock Safety Sentinel rank!`
                  : `You are an active guardian strengthening community coverage with ${stats.totalInvitedCount} invited members.`}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/50 flex items-center gap-1.5 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Data Leak Guarantee</span>
          </div>
        </div>

        {/* Invited Members Table / List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Invited Community Members ({stats.totalInvitedCount})</span>
          </h4>

          {stats.invitedMembers.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center space-y-2">
              <p className="text-xs text-slate-300 font-medium">No member referrals registered yet</p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Share your referral link via WhatsApp, SMS, or social media to help family and neighbors stay informed on safety hazards.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
              {stats.invitedMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-[10px]">
                      #
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{member.pseudonymLabel}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Badge variant="success" className="text-[10px]">
                    {member.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
