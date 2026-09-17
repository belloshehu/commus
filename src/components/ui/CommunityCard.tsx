import React from 'react';
import { Users, Lock, Shield, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

export interface CommunityCardProps {
  id: string;
  name: string;
  isPrivate: boolean;
  geohashPrefix: string;
  memberCount: number;
  activeIncidentsCount: number;
  onSelect?: (id: string) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  id,
  name,
  isPrivate,
  geohashPrefix,
  memberCount,
  activeIncidentsCount,
  onSelect,
}) => {
  return (
    <Card hoverable variant="highlight">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge variant={isPrivate ? 'warning' : 'info'} icon={isPrivate ? <Lock className="w-3 h-3" /> : <Shield className="w-3 h-3" />}>
            {isPrivate ? 'Private Community' : 'Public Safety Zone'}
          </Badge>
          {activeIncidentsCount > 0 && (
            <Badge variant="danger">
              {activeIncidentsCount} Active
            </Badge>
          )}
        </div>
        <CardTitle>{name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Zone Geohash: <strong className="font-mono text-slate-100">{geohashPrefix}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Verified Members: <strong className="text-slate-100">{memberCount}</strong></span>
        </div>
      </CardContent>

      <CardFooter>
        <span className="text-[11px] text-slate-400">Multi-tenant Boundary Protected</span>
        <Button size="sm" variant="primary" onClick={() => onSelect && onSelect(id)}>
          Enter Zone
        </Button>
      </CardFooter>
    </Card>
  );
};
