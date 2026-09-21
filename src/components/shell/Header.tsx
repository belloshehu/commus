import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Bell, User, Globe, Menu, LogIn } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Badge } from '../ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n/context';
import { SupportedLocale } from '@/lib/i18n/types';

export interface HeaderProps {
  currentLocale?: 'en' | 'ar';
  onLocaleChange?: (locale: any) => void;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onToggleMobileMenu?: () => void;
  isRtdbConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlertCount,
  onOpenNotifications,
  onOpenProfile,
  onToggleMobileMenu,
  isRtdbConnected = true,
}) => {
  const { session, logout } = useAuth();
  const router = useRouter();
  const { locale, setLocale, availableLocales, metadata } = useTranslation();

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

          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-950/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">COMMUS</span>
                <Badge variant="synthetic" size="sm">DEV</Badge>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">
                Early-Warning & Safety Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Live Sync Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <StatusIndicator status={isRtdbConnected ? 'connected' : 'offline'} />
        </div>

        {/* Right: Actions (Language Selector, Notifications, Auth / Profile) */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector Dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 transition-all">
            <Globe className="w-3.5 h-3.5 text-sky-400 mr-1.5 shrink-0" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Select preferred language"
            >
              {availableLocales.map((loc) => (
                <option key={loc.code} value={loc.code} className="bg-slate-950 text-white">
                  {loc.flagEmoji} {loc.nativeName} ({loc.englishName}) {loc.dir === 'rtl' ? ' [RTL]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label={`Open notifications. ${unreadAlertCount} unread alerts.`}
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Auth / Profile Action */}
          {session.isAuthenticated ? (
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Open User Profile Page"
            >
              <span className="text-xs font-medium hidden sm:inline">{session.role}</span>
              <div className="w-7 h-7 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-300 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
;
