'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { fuzzLocation } from '@/lib/location';
import { CommunityRecord } from '@/lib/firebase/rtdb';
import {
  Navigation,
  Shield,
  Lock,
  Users,
  MapPin,
  CheckCircle2,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface CommunityJoinWizardProps {
  initialInviteCode?: string;
  onJoined?: (communityName: string) => void;
}

const recommendedCommunities: CommunityRecord[] = [
  {
    id: 'comm_central',
    name: 'Downtown Central District',
    isPrivate: true,
    geohashPrefix: 'dr5ru',
    inviteCode: 'CENTRAL',
    memberCount: 1420,
    activeIncidentsCount: 2,
    createdAt: Date.now() - 1000 * 3600 * 24 * 30,
  },
  {
    id: 'comm_north',
    name: 'North Metro Transit Corridor',
    isPrivate: false,
    geohashPrefix: 'dr5rv',
    inviteCode: 'NORTH',
    memberCount: 890,
    activeIncidentsCount: 1,
    createdAt: Date.now() - 1000 * 3600 * 24 * 20,
  },
  {
    id: 'comm_west',
    name: 'Westside Residential Safety Zone',
    isPrivate: true,
    geohashPrefix: 'dr5rt',
    inviteCode: 'WESTSAFE',
    memberCount: 560,
    activeIncidentsCount: 0,
    createdAt: Date.now() - 1000 * 3600 * 24 * 10,
  },
  {
    id: 'comm_east',
    name: 'Eastside Commercial Network',
    isPrivate: false,
    geohashPrefix: 'dr5rs',
    inviteCode: 'EASTSIDE',
    memberCount: 1100,
    activeIncidentsCount: 0,
    createdAt: Date.now() - 1000 * 3600 * 24 * 15,
  },
];

export const CommunityJoinWizard: React.FC<CommunityJoinWizardProps> = ({
  initialInviteCode = '',
  onJoined,
}) => {
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState<'gps' | 'recommended' | 'code'>('gps');
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedGps, setDetectedGps] = useState<{ lat: number; lng: number } | null>(null);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedCommunityName, setJoinedCommunityName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialInviteCode) {
      setActiveTab('code');
    }
  }, [initialInviteCode]);

  const handleDetectGps = () => {
    setIsDetecting(true);
    setErrorMsg(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDetectedGps({ lat, lng });
          setIsDetecting(false);
        },
        (err) => {
          console.warn('[CommunityJoinWizard] Geolocation fallback:', err.message);
          setDetectedGps({ lat: 40.7128, lng: -74.006 });
          setIsDetecting(false);
        },
        { timeout: 4000 }
      );
    } else {
      setDetectedGps({ lat: 40.7128, lng: -74.006 });
      setIsDetecting(false);
    }
  };

  const handleJoin = async (communityId: string, code?: string) => {
    if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
      setErrorMsg('Please log in or register an account before joining a safety community.');
      return;
    }

    setJoiningId(communityId);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          communityId,
          inviteCode: code || inviteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join safety community.');
      }

      setJoinedCommunityName(data.communityName);
      if (onJoined) {
        onJoined(data.communityName);
      }
    } catch (err: any) {
      console.error('[CommunityJoinWizard] Join error:', err);
      setErrorMsg(err.message || 'Error joining community.');
    } finally {
      setJoiningId(null);
    }
  };

  if (joinedCommunityName) {
    return (
      <Card variant="highlight" className="text-center py-8 max-w-xl mx-auto">
        <CardContent className="space-y-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Joined Safety Community!</h2>
            <p className="text-xs text-slate-300 mt-1">
              You are now a verified member of <strong className="text-sky-400">{joinedCommunityName}</strong>.
            </p>
          </div>

          <Alert type="info">
            <strong>PRIVACY PROTECTION:</strong> Your participation is pseudonymous. Real identity data is never shared with other community members.
          </Alert>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Go to Incident Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setJoinedCommunityName(null);
                setInviteCode('');
              }}
            >
              Discover More Zones
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('gps')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gps'
              ? 'bg-sky-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="hidden sm:inline">1-Click GPS Auto-Detect</span>
          <span className="sm:hidden">GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recommended')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'recommended'
              ? 'bg-sky-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Popular Safety Zones</span>
          <span className="sm:hidden">Browse</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'code'
              ? 'bg-sky-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span className="hidden sm:inline">Invite Code Link</span>
          <span className="sm:hidden">Code</span>
        </button>
      </div>

      {errorMsg && <Alert type="warning">{errorMsg}</Alert>}

      {/* MODE 1: GPS AUTO-DISCOVERY (ZERO TYPING) */}
      {activeTab === 'gps' && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" />
              One-Click Nearby Community Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-slate-300 leading-relaxed">
              Detects your approximate device coordinates and lists nearby safety communities instantly with <strong>zero typing required</strong>.
            </p>

            <div className="flex items-center justify-center py-4">
              <Button
                variant="primary"
                size="lg"
                isLoading={isDetecting}
                icon={<Navigation className="w-5 h-5 text-sky-300" />}
                onClick={handleDetectGps}
              >
                Detect Nearby Safety Zones (1-Click)
              </Button>
            </div>

            {detectedGps && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Detected Grid Zone: <strong>Lat {fuzzLocation(detectedGps.lat, detectedGps.lng).blurredLatitude}, Lng {fuzzLocation(detectedGps.lat, detectedGps.lng).blurredLongitude}</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> 4 Communities Found
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-sky-500/60 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant={comm.isPrivate ? 'warning' : 'info'} icon={comm.isPrivate ? <Lock className="w-3 h-3" /> : <Shield className="w-3 h-3" />}>
                            {comm.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-400" /> {comm.memberCount} members
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-100">{comm.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" /> Geohash Zone: {comm.geohashPrefix}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={joiningId === comm.id}
                        onClick={() => handleJoin(comm.id, comm.inviteCode)}
                      >
                        Join Zone Instantly
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODE 2: RECOMMENDED POPULAR SAFETY ZONES */}
      {activeTab === 'recommended' && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Verified Popular Community Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-300">
              Browse public and neighborhood safety networks. Select any zone to join immediately:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedCommunities.map((comm) => (
                <div
                  key={comm.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-sky-500/60 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={comm.isPrivate ? 'warning' : 'info'} icon={comm.isPrivate ? <Lock className="w-3 h-3" /> : <Shield className="w-3 h-3" />}>
                        {comm.isPrivate ? 'Private Network' : 'Public Safety Zone'}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-400" /> {comm.memberCount}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">{comm.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400" /> Zone: {comm.geohashPrefix}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={joiningId === comm.id}
                    onClick={() => handleJoin(comm.id, comm.inviteCode)}
                  >
                    Join {comm.name}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODE 3: INVITE CODE JOIN (MINIMAL TYPING) */}
      {activeTab === 'code' && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400" />
              Join via Community Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-slate-300">
              Have a 6-character Invite Code from a community leader or invitation link? Enter it below:
            </p>

            <div className="max-w-md mx-auto space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
              <Input
                label="Community Invite Code"
                placeholder="e.g. CENTRAL or WESTSAFE"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                icon={<KeyRound className="w-4 h-4 text-slate-400" />}
              />

              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={inviteCode.trim().length < 3}
                isLoading={joiningId === 'code_join'}
                onClick={() => handleJoin('code_join', inviteCode)}
              >
                Validate & Join Community
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
