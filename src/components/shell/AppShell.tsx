import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationDrawer, AlertNotification } from './NotificationDrawer';
import { ProfileMenu } from './ProfileMenu';
import { Alert } from '../ui/Alert';

export interface AppShellProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabSelect?: (tabId: string) => void;
  alerts?: AlertNotification[];
  currentLocale?: 'en' | 'ar';
  onLocaleChange?: (locale: 'en' | 'ar') => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab = 'incidents',
  onTabSelect = () => {},
  alerts = [],
  currentLocale = 'en',
  onLocaleChange = () => {},
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<AlertNotification[]>(alerts);

  const isRtl = currentLocale === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        currentLocale={currentLocale}
        onLocaleChange={onLocaleChange}
        unreadAlertCount={activeAlerts.length}
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
              SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.
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
        alerts={activeAlerts}
        onClearAlerts={() => setActiveAlerts([])}
      />

      {/* User Profile Security Menu */}
      <ProfileMenu
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
