import React, { useState } from 'react';
import { MapPin, ShieldCheck, Clock, AlertTriangle, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { DangerLevelIndicator, DangerLevel } from './DangerLevelIndicator';
import { Button } from './Button';
import { CategoryBadge } from '@/lib/incidentCategoryHelper';
import { VoteConfirmationModal } from './VoteConfirmationModal';

export interface IncidentCardData {
  id: string;
  communityId: string;
  category: string;
  title: string;
  description: string;
  reporterLabel: string;
  blurredLocation: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
  incidentLocation?: {
    address?: string;
    landmark?: string;
    locationName?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isFuzzed?: boolean;
  };
  severity: DangerLevel;
  status: 'SUBMITTED' | 'VERIFIED' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
  upvotes?: number;
  downvotes?: number;
  authenticityStatus?: 'VERIFIED_COMMUNITY' | 'UNREVIEWED' | 'QUESTIONABLE_AUTHENTICITY';
  userVote?: 'UP' | 'DOWN' | null;
  createdAt: number;
}

export interface IncidentCardProps {
  incident: IncidentCardData;
  onViewDetails?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onVote?: (id: string, voteType: 'UP' | 'DOWN') => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onViewDetails,
  onEscalate,
  onVote,
}) => {
  const [pendingVote, setPendingVote] = useState<'UP' | 'DOWN' | null>(null);

  const statusBadgeVariant = {
    SUBMITTED: 'info',
    VERIFIED: 'success',
    ESCALATED: 'danger',
    RESOLVED: 'neutral',
    DISMISSED: 'neutral',
  } as const;

  const formattedDate = new Date(incident.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const upvotes = incident.upvotes || 0;
  const downvotes = incident.downvotes || 0;
  const totalVotes = upvotes + downvotes;
  const isQuestionable =
    incident.authenticityStatus === 'QUESTIONABLE_AUTHENTICITY' ||
    (totalVotes > 0 && downvotes / totalVotes > 0.20);

  return (
    <>
      <Card hoverable className="flex flex-col justify-between">
        <div>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={statusBadgeVariant[incident.status]}>
                  {incident.status}
                </Badge>
                <CategoryBadge category={incident.category} size="sm" />
                {isQuestionable && (
                  <Badge variant="danger" className="animate-pulse flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>QUESTIONABLE</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
            <CardTitle>{incident.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
              {incident.description}
            </p>

            <DangerLevelIndicator level={incident.severity} showSafetyBanner={incident.severity === 'HIGH' || incident.severity === 'CRITICAL'} />

            {/* Questionable Authenticity Alert Banner */}
            {isQuestionable && (
              <div className="bg-rose-950/70 border border-rose-500/80 rounded-lg p-2.5 flex items-center gap-2 text-rose-200 text-xs font-medium shadow-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Questionable Authenticity:</strong> Over 20% downvotes ({Math.round((downvotes / (totalVotes || 1)) * 100)}% downvoted). Review carefully.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
              {/* Generic Verified Reporter Label Guarantee */}
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{incident.reporterLabel || 'Reported by a verified community member'}</span>
              </div>

              {/* Location Name, State, Country & Geohash Zone */}
              <div className="flex flex-col gap-0.5 text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-[11px] truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>
                    {[
                      incident.incidentLocation?.locationName || 'Central District',
                      incident.incidentLocation?.state || 'Lagos State',
                      incident.incidentLocation?.country || 'Nigeria',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-5">
                  <span>Geohash Zone: <strong className="text-slate-300">{incident.blurredLocation.geohash}</strong> (~1.5km blur)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </div>

        <CardFooter className="flex flex-col gap-2.5 pt-3 border-t border-slate-800/80">
          {/* Top Row: Vote buttons (left) & View Incident button (right) */}
          <div className="flex items-center justify-between w-full gap-2">
            {/* Community Upvote / Downvote Approval Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 shrink-0">
              <button
                type="button"
                onClick={() => setPendingVote('UP')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  incident.userVote === 'UP'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
                title="Approve / Upvote Report Authenticity"
                aria-label={`Upvote report authenticity. Current upvotes: ${upvotes}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{upvotes}</span>
              </button>

              <div className="h-4 w-px bg-slate-800" />

              <button
                type="button"
                onClick={() => setPendingVote('DOWN')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  incident.userVote === 'DOWN'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                }`}
                title="Question / Downvote Report Authenticity"
                aria-label={`Downvote report authenticity. Current downvotes: ${downvotes}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{downvotes}</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails && onViewDetails(incident.id)}
            >
              View Incident
            </Button>
          </div>

          {/* Bottom Row: Escalate Button (Pushed down below full width) */}
          {onEscalate && incident.status !== 'ESCALATED' && (
            <Button
              variant="danger"
              size="sm"
              className="w-full justify-center"
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              onClick={() => onEscalate(incident.id)}
            >
              Escalate Incident
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Confirmation Modal when user clicks Upvote or Downvote */}
      <VoteConfirmationModal
        isOpen={Boolean(pendingVote)}
        voteType={pendingVote}
        incidentTitle={incident.title}
        onClose={() => setPendingVote(null)}
        onConfirm={() => {
          if (onVote && pendingVote) {
            onVote(incident.id, pendingVote);
          }
          setPendingVote(null);
        }}
      />
    </>
  );
};
