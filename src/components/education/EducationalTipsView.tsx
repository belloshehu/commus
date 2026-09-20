'use client';

import React, { useState, useMemo } from 'react';
import { EducationalTip, EducationalTipCategory } from '@/lib/education/types';
import { PRE_SEEDED_TIPS } from '@/lib/education/tipsData';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  BookOpen,
  Search,
  Shield,
  AlertTriangle,
  Users,
  Megaphone,
  HeartHandshake,
  Plus,
  Clock,
  CheckCircle2,
  X,
  Filter,
  ArrowRight,
} from 'lucide-react';

interface EducationalTipsViewProps {
  userSession?: any;
}

export const EducationalTipsView: React.FC<EducationalTipsViewProps> = ({ userSession }) => {
  const [tips, setTips] = useState<EducationalTip[]>(PRE_SEEDED_TIPS);
  const [selectedCategory, setSelectedCategory] = useState<EducationalTipCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingTip, setReadingTip] = useState<EducationalTip | null>(null);
  const [isCreatingTip, setIsCreatingTip] = useState(false);

  // Admin New Tip Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EducationalTipCategory>('SAFE_REPORTING');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      const matchesCategory = selectedCategory === 'ALL' || tip.category === selectedCategory;
      const matchesSearch =
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [tips, selectedCategory, searchQuery]);

  const handleCreateTip = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const created: EducationalTip = {
      id: `tip_${Date.now()}`,
      title: newTitle,
      category: newCategory,
      categoryLabel: newCategory.replace(/_/g, ' '),
      summary: newSummary || newTitle,
      content: newContent,
      tags: ['Community', 'Admin Created'],
      author: userSession?.userId ? `Leader (${userSession.userId})` : 'Community Admin',
      estimatedReadMinutes: Math.max(2, Math.ceil(newContent.split(' ').length / 150)),
      updatedAt: Date.now(),
      isPublished: true,
    };

    setTips([created, ...tips]);
    setIsCreatingTip(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  };

  const getCategoryIcon = (category: EducationalTipCategory) => {
    switch (category) {
      case 'SAFE_REPORTING':
      case 'PERSONAL_SAFETY':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'DE_ESCALATION':
        return <HeartHandshake className="w-4 h-4 text-emerald-400" />;
      case 'INVITING_MEMBERS':
      case 'COMMUNITY_PARTICIPATION':
        return <Users className="w-4 h-4 text-sky-400" />;
      case 'CAMPAIGN_ORGANIZATION':
        return <Megaphone className="w-4 h-4 text-purple-400" />;
      case 'PREVENTING_JUNGLE_JUSTICE':
      case 'JUNGLE_JUSTICE_CONSEQUENCES':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  const isAdmin =
    userSession?.role === 'SYSTEM_ADMIN' ||
    userSession?.role === 'VERIFIED_COMMUNITY_LEADER';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
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
            All Topics ({tips.length})
          </button>

          <button
            onClick={() => setSelectedCategory('PREVENTING_JUNGLE_JUSTICE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'PREVENTING_JUNGLE_JUSTICE'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Preventing Jungle Justice
          </button>

          <button
            onClick={() => setSelectedCategory('SAFE_REPORTING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'SAFE_REPORTING'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Safe Reporting
          </button>

          <button
            onClick={() => setSelectedCategory('DE_ESCALATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'DE_ESCALATION'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            De-escalation
          </button>
        </div>

        {/* Search & Admin Add Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guides & tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreatingTip(true)}
            >
              Add Tip
            </Button>
          )}
        </div>
      </div>

      {/* Educational Tips Grid */}
      {filteredTips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTips.map((tip) => (
            <Card
              key={tip.id}
              hoverable
              className="bg-slate-900/80 border border-slate-800 flex flex-col justify-between transition-all duration-300 shadow-md group"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(tip.category)}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {tip.categoryLabel}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {tip.estimatedReadMinutes} min read
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  {tip.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {tip.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tip.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">By {tip.author}</span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => setReadingTip(tip)}
                >
                  Read Full Guide
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold text-sm">No educational tips match filter</p>
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

      {/* Reading Drawer */}
      <Drawer
        isOpen={!!readingTip}
        onClose={() => setReadingTip(null)}
        title={readingTip?.title || 'Educational Guide'}
      >
        {readingTip && (
          <div className="space-y-6 py-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">{readingTip.categoryLabel}</Badge>
                <span className="text-xs text-slate-400 font-mono">
                  {readingTip.estimatedReadMinutes} min read
                </span>
              </div>
              <span className="text-xs text-slate-500">Author: {readingTip.author}</span>
            </div>

            <div className="prose prose-invert prose-xs max-w-none space-y-4">
              {readingTip.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-base font-bold text-sky-300 pt-2 border-b border-slate-800 pb-1">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                return <p key={idx} className="text-slate-300 leading-relaxed">{paragraph}</p>;
              })}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Non-Confrontational Guidance</span>
              </div>
              <p className="text-[11px] text-slate-400">
                This educational article is curated by verified community safety experts. Always follow local law enforcement directions in emergency situations.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Admin Tip Creation Modal */}
      {isCreatingTip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                Publish Educational Article (Admin)
              </h3>
              <button
                onClick={() => setIsCreatingTip(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Article Title:</label>
                <input
                  type="text"
                  placeholder="e.g., Early De-escalation Strategies in Crowded Markets"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as EducationalTipCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="PREVENTING_JUNGLE_JUSTICE">Preventing Jungle Justice</option>
                  <option value="JUNGLE_JUSTICE_CONSEQUENCES">Consequences of Jungle Justice</option>
                  <option value="SAFE_REPORTING">Safe Reporting</option>
                  <option value="PERSONAL_SAFETY">Personal Safety</option>
                  <option value="DE_ESCALATION">De-escalation</option>
                  <option value="INVITING_MEMBERS">Inviting Members</option>
                  <option value="COMMUNITY_PARTICIPATION">Community Participation</option>
                  <option value="CAMPAIGN_ORGANIZATION">Campaign Organization</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Summary:</label>
                <input
                  type="text"
                  placeholder="Short 1-2 sentence description for preview cards..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Content (Markdown supported):</label>
                <textarea
                  rows={5}
                  placeholder="### Section Title&#10;Detailed guidance content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingTip(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateTip}
                disabled={!newTitle.trim() || !newContent.trim()}
              >
                Publish Article
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
