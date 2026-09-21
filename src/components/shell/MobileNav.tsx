import React from 'react';
import { Activity, Bell, Shield, Radio, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export interface MobileNavProps {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabSelect,
}) => {
  const { t } = useTranslation();

  const items = [
    { id: 'incidents', label: t('nav.incidentFeed'), icon: <Activity className="w-4 h-4" /> },
    { id: 'alerts', label: t('nav.alerts'), icon: <Bell className="w-4 h-4" /> },
    { id: 'guidance', label: t('nav.safetyGuidance'), icon: <Shield className="w-4 h-4" /> },
    { id: 'dispatch', label: t('nav.authorityDispatch'), icon: <Radio className="w-4 h-4" /> },
    { id: 'about', label: t('nav.about') || 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabSelect(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-colors focus:outline-none ${
              isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
