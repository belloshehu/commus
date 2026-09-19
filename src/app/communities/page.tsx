'use client';

import React, { useState, Suspense } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { CommunityJoinWizard } from '@/components/community/CommunityJoinWizard';
import { Building2, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function CommunitiesContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  return (
    <AppShell currentLocale={locale} onLocaleChange={setLocale} activeTab="communities">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800 flex items-center justify-center text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Safety Zone & Community Discovery
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              1-click GPS auto-detect, recommended neighborhood networks, and invite code joining
            </p>
          </div>
        </div>

        {/* Low-Typing Community Join Wizard */}
        <CommunityJoinWizard initialInviteCode={code} />
      </div>
    </AppShell>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Community Discovery...</div>}>
      <CommunitiesContent />
    </Suspense>
  );
}
