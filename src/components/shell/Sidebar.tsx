import React from 'react';
import { Activity, Map, Bell, Shield, Radio, ChevronRight, Building2, BookOpen, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export interface SidebarProps {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabSelect,
}) => {
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      id: 'incidents',
      label: t('nav.incidentFeed'),
      icon: <Activity className="w-4 h-4" />,
      badge: 'Live',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      id: 'communities',
      label: t('nav.joinCommunity'),
      icon: <Building2 className="w-4 h-4" />,
      badge: '1-Click',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
    },
    {
      id: 'education',
      label: t('nav.educationBadges'),
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Badges',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
    {
      id: 'map',
      label: t('nav.responseMap'),
      icon: <Map className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: t('nav.alerts'),
      icon: <Bell className="w-4 h-4" />,
      badge: '3 High',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'guidance',
      label: t('nav.safetyGuidance'),
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'dispatch',
      label: t('nav.authorityDispatch'),
      icon: <Radio className="w-4 h-4" />,
      badge: 'Audited',
      badgeColor: 'bg-red-950 text-red-300 border-red-800',
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: 'RBAC',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-950 border-r border-slate-800/80 p-4 gap-6 min-h-[calc(100vh-61px)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
          Navigation & Controls
        </span>

        <nav className="flex flex-col gap-1 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabSelect(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-2">
        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-Confrontation Policy</span>
        </div>
        <p className="leading-relaxed">
          Never approach or confront active hazards. Protect yourself and report safely.
        </p>
      </div>
    </aside>
  );
};
