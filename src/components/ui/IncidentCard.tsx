import React from 'react';
import { MapPin, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { DangerLevelIndicator, DangerLevel } from './DangerLevelIndicator';
import { Button } from './Button';

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
  severity: DangerLevel;
  status: 'SUBMITTED' | 'VERIFIED' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
  createdAt: number;
}

export interface IncidentCardProps {
  incident: IncidentCardData;
  onViewDetails?: (id: string) => void;
  onEscalate?: (id: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onViewDetails,
  onEscalate,
}) => {
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

  return (
    <Card hoverable className="flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant={statusBadgeVariant[incident.status]}>
              {incident.status}
            </Badge>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
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

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
            {/* Generic Verified Reporter Label Guarantee */}
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{incident.reporterLabel || 'Reported by a verified community member'}</span>
            </div>

            {/* Blurred Geohash Location */}
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span>Geohash Zone: <strong className="text-slate-200">{incident.blurredLocation.geohash}</strong> (~1.5km blur)</span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails && onViewDetails(incident.id)}
        >
          View Incident
        </Button>
        {onEscalate && incident.status !== 'ESCALATED' && (
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            onClick={() => onEscalate(incident.id)}
          >
            Escalate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
