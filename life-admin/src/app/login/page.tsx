'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(() => searchParams.get('error'));
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-yellow flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline font-bold text-5xl text-brutal-ink mb-2">
            SIGN IN
          </h1>
          <p className="font-mono text-sm text-brutal-ink/60 uppercase tracking-wider">
            Smart Life Inbox
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="brutal-border-2 bg-brutal-coral p-4 mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
            <p className="font-body text-sm text-brutal-ink font-semibold">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block font-headline font-bold text-xs uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-brutal-offwhite text-brutal-ink font-body
                         border-2 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                         focus:bg-brutal-yellow focus:shadow-[6px_6px_0px_0px_#1A1A1A] focus:outline-none
                         transition-all duration-150"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-headline font-bold text-xs uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-brutal-offwhite text-brutal-ink font-body
                         border-2 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                         focus:bg-brutal-yellow focus:shadow-[6px_6px_0px_0px_#1A1A1A] focus:outline-none
                         transition-all duration-150"
              placeholder="••••••••"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-brutal-coral text-brutal-ink font-headline font-bold uppercase
                       tracking-wider border-3 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                       hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A]
                       active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                       transition-all duration-100 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[3px] bg-brutal-ink" />
          <span className="font-mono text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-[3px] bg-brutal-ink" />
        </div>

        {/* Google OAuth */}
        <button
          id="login-google-btn"
          onClick={handleGoogleLogin}
          className="w-full px-6 py-4 bg-brutal-offwhite text-brutal-ink font-headline font-bold uppercase
                     tracking-wider border-3 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                     hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A]
                     active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                     transition-all duration-100 cursor-pointer"
        >
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <p className="mt-8 text-center font-body text-sm text-brutal-ink/70">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-brutal-ink underline underline-offset-4">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <div className="font-headline font-bold text-2xl text-brutal-ink uppercase tracking-wider">
          Loading...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
