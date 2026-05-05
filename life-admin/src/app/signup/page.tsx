'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
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

  if (success) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="brutal-border bg-brutal-lime p-8 shadow-[8px_8px_0px_0px_#1A1A1A]">
            <h1 className="font-headline font-bold text-3xl text-brutal-ink mb-4">
              CHECK YOUR EMAIL
            </h1>
            <p className="font-body text-base text-brutal-ink mb-6">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-brutal-ink text-brutal-offwhite font-headline font-bold uppercase
                         tracking-wider border-3 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                         hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A]
                         active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                         transition-all duration-100"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-yellow flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline font-bold text-5xl text-brutal-ink mb-2">
            SIGN UP
          </h1>
          <p className="font-mono text-sm text-brutal-ink/60 uppercase tracking-wider">
            Create your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="brutal-border-2 bg-brutal-coral p-4 mb-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
            <p className="font-body text-sm text-brutal-ink font-semibold">{error}</p>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-4 mb-6">
          <div>
            <label className="block font-headline font-bold text-xs uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="signup-email"
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
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-brutal-offwhite text-brutal-ink font-body
                         border-2 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                         focus:bg-brutal-yellow focus:shadow-[6px_6px_0px_0px_#1A1A1A] focus:outline-none
                         transition-all duration-150"
              placeholder="••••••••"
            />
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-brutal-lime text-brutal-ink font-headline font-bold uppercase
                       tracking-wider border-3 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                       hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A]
                       active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                       transition-all duration-100 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
          id="signup-google-btn"
          onClick={handleGoogleSignUp}
          className="w-full px-6 py-4 bg-brutal-offwhite text-brutal-ink font-headline font-bold uppercase
                     tracking-wider border-3 border-brutal-ink shadow-[4px_4px_0px_0px_#1A1A1A]
                     hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#1A1A1A]
                     active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                     transition-all duration-100 cursor-pointer"
        >
          Continue with Google
        </button>

        {/* Login Link */}
        <p className="mt-8 text-center font-body text-sm text-brutal-ink/70">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brutal-ink underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
