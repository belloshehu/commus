'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '../ui/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, LogIn, UserPlus } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <LoadingState label="Verifying security credentials..." count={1} />
      </div>
    );
  }

  if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
    return (
      <div className="p-8 max-w-md mx-auto my-12">
        <Card variant="danger">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-400">
              <Lock className="w-6 h-6" />
              <CardTitle>Authentication Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Anonymous users and unauthenticated visitors cannot submit incident reports, access private community feeds, or view sensitive safety information.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                icon={<LogIn className="w-4 h-4" />}
                onClick={() => router.push('/login')}
              >
                Sign In to Your Account
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => router.push('/register')}
              >
                Create Verified Citizen Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return (
      <div className="p-8 max-w-md mx-auto my-12">
        <Card variant="warning">
          <CardHeader>
            <CardTitle>Insufficient Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <p>Your current role (<strong className="text-white">{session.role}</strong>) does not have authorization to access this view.</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
