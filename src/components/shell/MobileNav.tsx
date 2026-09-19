import React from 'react';
import { Activity, Map, Bell, Shield, Radio, Building2 } from 'lucide-react';

export interface MobileNavProps {
  activeTab: string;
  onTabSelect: (tabId: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabSelect,
}) => {
  const items = [
    { id: 'incidents', label: 'Feed', icon: <Activity className="w-5 h-5" /> },
    { id: 'communities', label: 'Join', icon: <Building2 className="w-5 h-5" /> },
    { id: 'map', label: 'Map', icon: <Map className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'guidance', label: 'Safety', icon: <Shield className="w-5 h-5" /> },
    { id: 'dispatch', label: 'Dispatch', icon: <Radio className="w-5 h-5" /> },
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
