'use client';

import React from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserSession } from '@/lib/auth';

export default function AdminPage() {
  // In dev environment or active app session, retrieve or mock session
  const activeSession: UserSession = {
    userId: 'usr_admin_1',
    pseudonymId: 'pseudo_admin_prime',
    role: 'SYSTEM_ADMIN',
    isAuthenticated: true,
    communityId: 'comm_central',
  };

  return (
    <AppShell activeTab="admin">
      <AdminDashboard session={activeSession} />
    </AppShell>
  );
}
