'use client';

import React, { useState } from 'react';
import { EducationalTipsView } from './EducationalTipsView';
import { CampaignsView } from './CampaignsView';
import { BadgesView } from './BadgesView';
import { BookOpen, Megaphone, Award } from 'lucide-react';

interface EducationTabProps {
  userSession?: any;
}

export const EducationTab: React.FC<EducationTabProps> = ({ userSession }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tips' | 'campaigns' | 'badges'>('tips');

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('tips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'tips'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Tips & Guides
        </button>

        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'campaigns'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Educational Campaigns
        </button>

        <button
          onClick={() => setActiveSubTab('badges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'badges'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Verified Badges
        </button>
      </div>

      {/* Sub-tab Content Views */}
      {activeSubTab === 'tips' && <EducationalTipsView userSession={userSession} />}
      {activeSubTab === 'campaigns' && <CampaignsView userSession={userSession} />}
      {activeSubTab === 'badges' && <BadgesView userSession={userSession} />}
    </div>
  );
};
