import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationDrawer } from './NotificationDrawer';
import { ProfileMenu } from './ProfileMenu';
import { Alert } from '../ui/Alert';
import { I18nProvider, useTranslation } from '@/lib/i18n/context';

export interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabSelect?: (tabId: string) => void;
  alerts?: any[];
  currentLocale?: any;
  onLocaleChange?: (locale: any) => void;
}

const AppShellContent: React.FC<AppShellProps> = ({
  children,
  activeTab = 'incidents',
  onTabSelect = () => {},
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const { dir, isRtl, t } = useTranslation();

  return (
    <div dir={dir} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        unreadAlertCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabSelect={onTabSelect} />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-16 lg:mb-0 w-full overflow-x-hidden">
          {/* Top Safety Banner Mandate */}
          <div className="mb-6">
            <Alert type="safety">
              {t('common.safetyFirstNotice')}
            </Alert>
          </div>

          {children}
        </main>
      </div>

      {/* Responsive Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabSelect={onTabSelect} />

      {/* Notification Drawer Slide-over */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />

      {/* User Profile Security Menu */}
      <ProfileMenu
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => (
  <I18nProvider>
    <AppShellContent {...props} />
  </I18nProvider>
);
