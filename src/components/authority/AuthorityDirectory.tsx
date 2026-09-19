'use client';

import React, { useState, useMemo } from 'react';
import {
  COMMON_AUTHORITIES,
  AuthorityCategory,
  AuthorityOrganization,
} from '@/lib/authority/organizations';
import { AuthorityDirectoryCard } from './AuthorityDirectoryCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { IncidentRecord } from '@/lib/firebase/rtdb';
import {
  PhoneCall,
  Search,
  Shield,
  Flame,
  AlertTriangle,
  LifeBuoy,
  Lock,
  Filter,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

interface AuthorityDirectoryProps {
  incidents?: IncidentRecord[];
  userSession?: any;
  onEscalationSuccess?: (incidentId: string, org: AuthorityOrganization) => void;
}

export const AuthorityDirectory: React.FC<AuthorityDirectoryProps> = ({
  incidents = [],
  userSession,
  onEscalationSuccess,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AuthorityCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [escalateModalOrg, setEscalateModalOrg] = useState<AuthorityOrganization | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateSuccessMessage, setEscalateSuccessMessage] = useState<string | null>(null);
  const [escalateErrorMessage, setEscalateErrorMessage] = useState<string | null>(null);

  const filteredOrganizations = useMemo(() => {
    return COMMON_AUTHORITIES.filter((org) => {
      const matchesCategory =
        selectedCategory === 'ALL' || org.category === selectedCategory;
      const matchesSearch =
        org.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.primaryPhone.includes(searchQuery);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleEscalateClick = (org: AuthorityOrganization) => {
    setEscalateModalOrg(org);
    setEscalateSuccessMessage(null);
    setEscalateErrorMessage(null);
    if (incidents.length > 0) {
      setSelectedIncidentId(incidents[0].id || 'inc_101');
    }
  };

  const handleConfirmEscalation = async () => {
    if (!escalateModalOrg || !selectedIncidentId) return;

    setIsEscalating(true);
    setEscalateErrorMessage(null);
    setEscalateSuccessMessage(null);

    try {
      const res = await fetch('/api/authority/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: selectedIncidentId,
          reason: `Manual escalation dispatch to ${escalateModalOrg.title} (${escalateModalOrg.acronym}) via Emergency Directory`,
          session: userSession || {
            userId: 'user_local_dispatcher',
            role: 'AUTHORITY_DISPATCHER',
            isAuthenticated: true,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch authority escalation payload.');
      }

      setEscalateSuccessMessage(
        `Incident successfully dispatched to ${escalateModalOrg.acronym}! Ref ID: ${data.record?.escalationId || 'ESC-OK'}`
      );

      if (onEscalationSuccess) {
        onEscalationSuccess(selectedIncidentId, escalateModalOrg);
      }
    } catch (err: any) {
      setEscalateErrorMessage(err.message || 'An unexpected error occurred during dispatch.');
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Hotline Top Banner */}
      <Card className="bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-2 border-red-500/80 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <PhoneCall className="w-64 h-64 text-white" />
        </div>
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="danger" className="font-mono text-xs font-black animate-pulse">
                TOLL-FREE 24/7 HOTLINE
              </Badge>
              <span className="text-xs text-red-200 font-semibold uppercase tracking-wider">
                National Emergency Response
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Unified Emergency Dispatch Hotline — 112
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed">
              Instant multi-agency dispatch connecting Police, Fire Service, Ambulance, and Disaster Response nationwide. Free call on all mobile networks.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="tel:112"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-red-950 font-black text-sm shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-5 h-5 text-red-600 animate-bounce" />
              Dial 112 Now
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Directory Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Authorities
          </button>
          <button
            onClick={() => setSelectedCategory('POLICE_SECURITY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'POLICE_SECURITY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Police & Civil
          </button>
          <button
            onClick={() => setSelectedCategory('RESCUE_FIRE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'RESCUE_FIRE'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Fire & Rescue
          </button>
          <button
            onClick={() => setSelectedCategory('ROAD_SAFETY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'ROAD_SAFETY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Road Safety (FRSC)
          </button>
          <button
            onClick={() => setSelectedCategory('DISASTER_RELIEF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'DISASTER_RELIEF'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Disaster & Relief
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organization or hotline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Authority Cards Grid */}
      {filteredOrganizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrganizations.map((org) => (
            <AuthorityDirectoryCard
              key={org.id}
              organization={org}
              onEscalate={handleEscalateClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold text-sm">No authority matching filter</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Try resetting your search query or selecting a different authority category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Escalation Dispatch Modal */}
      {escalateModalOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <Badge variant="outline" className="font-mono text-[10px] mb-1">
                  OFFICIAL ESCALATION DISPATCH
                </Badge>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Escalate to {escalateModalOrg.acronym}
                </h3>
              </div>
              <button
                onClick={() => setEscalateModalOrg(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatching an official incident payload to <span className="text-sky-300 font-bold">{escalateModalOrg.title}</span> ({escalateModalOrg.primaryPhone}). Select an incident from your active community feed to transmit:
            </p>

            {incidents.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">
                  Select Active Incident Report:
                </label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {incidents.map((inc, idx) => (
                    <option key={inc.id || idx} value={inc.id || `inc_${idx}`}>
                      [{inc.dangerLevel || inc.severity || 'HIGH'}] {inc.title || 'Untitled Incident'} ({inc.category})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No active incidents loaded in current session feed. Incident ID fallback will be transmitted.</span>
              </div>
            )}

            {escalateSuccessMessage && (
              <div className="bg-emerald-950/60 border border-emerald-500/60 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{escalateSuccessMessage}</span>
              </div>
            )}

            {escalateErrorMessage && (
              <div className="bg-red-950/60 border border-red-500/60 p-3 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{escalateErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEscalateModalOrg(null)}
                disabled={isEscalating}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<ExternalLink className="w-4 h-4" />}
                onClick={handleConfirmEscalation}
                disabled={isEscalating}
              >
                {isEscalating ? 'Transmitting...' : `Dispatch to ${escalateModalOrg.acronym}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
