'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-xl shadow-sky-950/50">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ANTIJJ</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Password Recovery
          </p>
        </div>

        <Card variant="highlight">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert type="danger">{error}</Alert>}
            {success && (
              <Alert type="success">
                Password reset link sent! Check your inbox for instructions to update your password.
              </Alert>
            )}

            <form onSubmit={handleReset} className="space-y-3">
              <Input
                label="Registered Email Address"
                type="email"
                required
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />

              <Button
                variant="primary"
                fullWidth
                type="submit"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <Link href="/login" className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
