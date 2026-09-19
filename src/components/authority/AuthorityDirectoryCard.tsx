'use client';

import React, { useState } from 'react';
import { AuthorityOrganization } from '@/lib/authority/organizations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import {
  PhoneCall,
  Copy,
  Check,
  Shield,
  Flame,
  AlertTriangle,
  LifeBuoy,
  Lock,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface AuthorityDirectoryCardProps {
  organization: AuthorityOrganization;
  onEscalate?: (org: AuthorityOrganization) => void;
}

export const AuthorityDirectoryCard: React.FC<AuthorityDirectoryCardProps> = ({
  organization,
  onEscalate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(organization.primaryPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderBadgeIcon = () => {
    switch (organization.iconType) {
      case 'police':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/60 flex items-center justify-center text-blue-400 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
        );
      case 'fire':
        return (
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 shadow-md">
            <Flame className="w-6 h-6" />
          </div>
        );
      case 'road':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'nema':
        return (
          <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-500/60 flex items-center justify-center text-teal-400 shadow-md">
            <LifeBuoy className="w-6 h-6" />
          </div>
        );
      case 'nscdc':
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/60 flex items-center justify-center text-indigo-400 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
        );
      case 'sema':
        return (
          <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-500/60 flex items-center justify-center text-sky-400 shadow-md">
            <Radio className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Shield className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <Card
      hoverable
      className={`bg-gradient-to-br ${organization.brandGradient} border ${organization.borderColor} flex flex-col justify-between transition-all duration-300 shadow-lg`}
    >
      <div>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              {renderBadgeIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] font-bold">
                    {organization.acronym}
                  </Badge>
                  <Badge variant="info" className="text-[10px]">
                    {organization.categoryLabel}
                  </Badge>
                </div>
                <CardTitle className="text-base font-extrabold text-white mt-1">
                  {organization.title}
                </CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {organization.description}
          </p>

          {/* Hotline Contacts Grid */}
          <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Primary Hotline:</span>
              <span className="font-mono font-bold text-sky-300 text-sm">
                {organization.primaryPhone}
              </span>
            </div>

            {organization.secondaryPhone && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-medium">Secondary Contact:</span>
                <span className="font-mono font-semibold text-slate-300 text-xs">
                  {organization.secondaryPhone}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <a
            href={`tel:${organization.primaryPhone}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Call Hotline
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyPhone}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {onEscalate && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => onEscalate(organization)}
            className="w-full sm:w-auto"
          >
            Escalate Incident
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
