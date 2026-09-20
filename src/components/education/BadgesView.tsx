'use client';

import React, { useState, useEffect } from 'react';
import { UserBadgeAward, BadgeAuditLog } from '@/lib/education/types';
import { ALL_BADGE_DEFINITIONS } from '@/lib/badges/definitions';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  Users,
  Megaphone,
  HeartHandshake,
  Crown,
  Star,
  CheckCircle2,
  Lock,
  RefreshCw,
  FileCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface BadgesViewProps {
  userSession?: any;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ userSession }) => {
  const [awardedBadges, setAwardedBadges] = useState<UserBadgeAward[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedAuditAward, setSelectedAuditAward] = useState<UserBadgeAward | null>(null);

  const activeUserId = userSession?.userId || 'user_demo_101';

  const handleEvaluateBadges = React.useCallback(async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/badges/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: userSession,
          targetUserId: activeUserId,
          mockVerifiedEvents: [
            {
              eventId: `vev_101`,
              userId: activeUserId,
              eventType: 'VERIFIED_INCIDENT_REPORT',
              referenceId: 'inc_101',
              timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
              verifiedByActorId: 'leader_verifier_01',
            },
            {
              eventId: `vev_102`,
              userId: activeUserId,
              eventType: 'VERIFIED_INCIDENT_REPORT',
              referenceId: 'inc_102',
              timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1,
              verifiedByActorId: 'authority_dispatcher_01',
            },
            {
              eventId: `vev_103`,
              userId: activeUserId,
              eventType: 'VERIFIED_INCIDENT_REPORT',
              referenceId: 'inc_103',
              timestamp: Date.now() - 1000 * 60 * 60 * 5,
              verifiedByActorId: 'leader_verifier_02',
            },
            {
              eventId: `vev_104`,
              userId: activeUserId,
              eventType: 'EARLY_WARNING_CONFIRMED',
              referenceId: 'inc_101',
              timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
              verifiedByActorId: 'authority_dispatcher_01',
            },
            {
              eventId: `vev_105`,
              userId: activeUserId,
              eventType: 'EARLY_WARNING_CONFIRMED',
              referenceId: 'inc_104',
              timestamp: Date.now() - 1000 * 60 * 60 * 12,
              verifiedByActorId: 'authority_dispatcher_02',
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.evaluation) {
        setAwardedBadges(data.evaluation.allCurrentBadges || []);
        setVerifiedCount(data.evaluation.verifiedEventsCount || 0);
      }
    } catch (err) {
      console.warn('Error evaluating user badges:', err);
    } finally {
      setIsEvaluating(false);
    }
  }, [activeUserId, userSession]);

  useEffect(() => {
    handleEvaluateBadges();
  }, [handleEvaluateBadges]);

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield-check':
        return <ShieldCheck className="w-7 h-7 text-blue-400" />;
      case 'alert-triangle':
        return <AlertTriangle className="w-7 h-7 text-red-400" />;
      case 'users':
        return <Users className="w-7 h-7 text-emerald-400" />;
      case 'megaphone':
        return <Megaphone className="w-7 h-7 text-purple-400" />;
      case 'heart-handshake':
        return <HeartHandshake className="w-7 h-7 text-pink-400" />;
      case 'crown':
        return <Crown className="w-7 h-7 text-amber-300" />;
      case 'star':
        return <Star className="w-7 h-7 text-slate-300" />;
      default:
        return <Award className="w-7 h-7 text-amber-400" />;
    }
  };

  const earnedBadgeIds = new Set(awardedBadges.map((b) => b.badgeId));

  return (
    <div className="space-y-6">
      {/* Top Banner & Anti-Spam Guarantee Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 p-6 rounded-2xl border border-amber-500/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-amber-300 border-amber-400/50">
              VERIFIED MERIT SYSTEM
            </Badge>
            <span className="text-xs text-amber-200 font-semibold">Verified Activity Badges</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Community Badges & Verified Safety Merit
          </h2>
          <p className="text-xs text-amber-200/80 max-w-xl">
            Earn Tier & Specialized badges based strictly on verified community actions. Client self-granting is blocked, and every badge award records an immutable SHA-256 audit entry.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />}
          onClick={handleEvaluateBadges}
          disabled={isEvaluating}
          className="bg-amber-600 hover:bg-amber-500 text-white shrink-0"
        >
          {isEvaluating ? 'Evaluating...' : 'Evaluate Eligibility'}
        </Button>
      </div>

      {/* Anti-Abuse Warning Callout */}
      <Alert type="info">
        <div className="flex items-center gap-2 font-bold text-sky-300 mb-0.5">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Anti-Spam Incentive Policy:</span>
        </div>
        Users are NOT rewarded simply for submitting raw report volume. Badge eligibility requires verified events validated by community leaders or emergency authorities.
      </Alert>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {ALL_BADGE_DEFINITIONS.map((def) => {
          const isEarned = earnedBadgeIds.has(def.id);
          const awardDetails = awardedBadges.find((b) => b.badgeId === def.id);

          return (
            <Card
              key={def.id}
              hoverable
              className={`bg-gradient-to-br ${def.badgeGradient} border ${def.borderColor} flex flex-col justify-between transition-all duration-300 shadow-md ${
                !isEarned ? 'opacity-70 grayscale-[30%]' : ''
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={def.category === 'TIER' ? 'outline' : 'info'} className="text-[9px] font-mono">
                      {def.level}
                    </Badge>

                    {isEarned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        EARNED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        LOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                      {renderBadgeIcon(def.iconName)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold text-white">
                        {def.name}
                      </CardTitle>
                      <span className="text-[10px] text-slate-400">
                        {def.category} BADGE
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {def.description}
                  </p>

                  <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Requirement:</span>
                    <span>{def.criteriaExplanation}</span>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {isEarned && awardDetails ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FileCheck className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={() => setSelectedAuditAward(awardDetails)}
                    className="w-full text-[10px]"
                  >
                    View Audit Log
                  </Button>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono w-full text-center">
                    Requires {def.requiredVerifiedEventsCount} verified events
                  </span>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Audit Log Modal */}
      {selectedAuditAward && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <Badge variant="outline" className="font-mono text-[10px] mb-1">
                  SHA-256 AUDIT LOG ENTRY
                </Badge>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {selectedAuditAward.badgeName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditAward(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Award Ref ID:</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedAuditAward.awardId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient ID:</span>
                  <span className="font-mono text-slate-300">{selectedAuditAward.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Awarded At:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedAuditAward.awardedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1">
                  <span className="text-slate-500">Criteria Met:</span>
                  <span className="text-slate-300 text-right">{selectedAuditAward.criteriaMet}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 block uppercase">
                  SHA-256 Payload Hash:
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-sky-400 break-all">
                  {selectedAuditAward.payloadHash}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAuditAward(null)}
              >
                Close Audit Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
