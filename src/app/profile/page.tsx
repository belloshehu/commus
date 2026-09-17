'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/shell/AppShell';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { User, Shield, Key, MapPin, Trash2, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, session, logout, deleteAccount } = useAuth();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await deleteAccount();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. You may need to re-authenticate first.');
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-extrabold text-white">Citizen Profile & Security Settings</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage identity privacy, community membership, and credentials</p>
            </div>
            <Button variant="outline" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {error && <Alert type="danger">{error}</Alert>}

          <Card variant="highlight">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-sky-300 font-bold text-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{profile?.displayName || 'Verified Citizen'}</CardTitle>
                    <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="success">AUTHENTICATED</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Role Assignment</span>
                  </span>
                  <div className="font-mono text-slate-100 font-bold text-sm">{session.role}</div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Primary Community Zone</span>
                  </span>
                  <div className="font-semibold text-slate-100 text-sm">{session.communityId}</div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>Public Pseudonym Token</span>
                  </span>
                  <div className="font-mono text-slate-200 text-xs bg-slate-900 p-2 rounded border border-slate-800">
                    {session.pseudonymId}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    This cryptographically generated token represents your reports in community feeds without revealing your real identity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion Card */}
          <Card variant="danger">
            <CardHeader>
              <CardTitle className="text-red-300">Danger Zone: Account Deletion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <p>
                Deleting your account permanently purges your user profile and private credentials from the database.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setIsDeleting(true)}
                >
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
          onConfirm={handleDeleteAccount}
          title="Permanently Delete Account"
          message="Are you sure you want to delete your citizen profile? This action is irreversible."
          isHighGravity={true}
          confirmLabel="Permanently Delete"
          isLoading={isLoading}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
