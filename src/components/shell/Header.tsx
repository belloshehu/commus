import React from 'react';
import { Shield, Bell, User, Globe, Menu } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Badge } from '../ui/Badge';

export interface HeaderProps {
  currentLocale: 'en' | 'ar';
  onLocaleChange: (locale: 'en' | 'ar') => void;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onToggleMobileMenu?: () => void;
  isRtdbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocale,
  onLocaleChange,
  unreadAlertCount,
  onOpenNotifications,
  onOpenProfile,
  onToggleMobileMenu,
  isRtdbConnected = true,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 border-b border-slate-800/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-950/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">ANTIJJ</span>
                <Badge variant="synthetic" size="sm">SYNTHETIC DEV</Badge>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">
                Early-Warning & Community Safety
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <StatusIndicator status={isRtdbConnected ? 'connected' : 'offline'} />
        </div>

        {/* Right: Actions (Locale, Notifications, Profile) */}
        <div className="flex items-center gap-2.5">
          {/* Locale Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1.5 hidden sm:block" />
            <button
              onClick={() => onLocaleChange('en')}
              className={`px-2 py-1 rounded ${currentLocale === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              aria-label="Switch language to English"
            >
              EN
            </button>
            <button
              onClick={() => onLocaleChange('ar')}
              className={`px-2 py-1 rounded ${currentLocale === 'ar' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              aria-label="Switch language to Arabic"
            >
              العربية
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label={`Open notifications drawer. ${unreadAlertCount} unread alerts.`}
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label="Open User Profile Menu"
          >
            <span className="text-xs font-medium hidden sm:inline">Citizen Member</span>
            <div className="w-7 h-7 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
