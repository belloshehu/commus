'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Shield, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { loginEmail, loginGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginEmail(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await loginGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
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
            Verified Community Safety Portal
          </p>
        </div>

        <Card variant="highlight">
          <CardHeader>
            <CardTitle>Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert type="danger">{error}</Alert>}

            {/* Google Authentication Button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleGoogleLogin}
              isLoading={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-mono text-slate-500 uppercase">Or Email</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />

              <div className="flex justify-end">
                <Link href="/reset-password" className="text-xs text-sky-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button
                variant="primary"
                fullWidth
                type="submit"
                isLoading={isLoading}
                icon={<LogIn className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <span className="text-xs text-slate-400">
              New to Antijj?{' '}
              <Link href="/register" className="text-sky-400 font-semibold hover:underline">
                Create an account
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
