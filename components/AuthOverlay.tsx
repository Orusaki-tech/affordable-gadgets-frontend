'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { LoginService, OpenAPI, RegisterService } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import { inventoryBaseUrl, setAuthToken } from '@/lib/api/openapi';
import { createClient } from '@/lib/supabase/client';
import { exchangeSupabaseToken } from '@/lib/supabase/auth-exchange';
import { getStoredUTMParams } from '@/lib/utm';
import { getSessionKey, trackLogin } from '@/lib/tracking';

export function AuthOverlay({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [authFieldErrors, setAuthFieldErrors] = useState<Record<string, string>>({});
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    username_or_email: '',
    username: '',
    email: '',
    password: '',
  });

  const validateAuthForm = (mode: 'login' | 'register') => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === 'login') {
      if (!authForm.username_or_email.trim()) errors.username_or_email = 'Email or username is required.';
      if (!authForm.password.trim()) errors.password = 'Password is required.';
    } else {
      if (!authForm.username.trim()) errors.username = 'Username is required.';
      if (!authForm.email.trim() || !emailRegex.test(authForm.email)) errors.email = 'Valid email is required.';
      if (!authForm.password.trim() || authForm.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    }
    setAuthFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isLoginReady = () => !!authForm.username_or_email.trim() && !!authForm.password.trim();
  const isRegisterReady = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!authForm.username.trim() && !!authForm.email.trim() && emailRegex.test(authForm.email) && authForm.password.length >= 8;
  };

  const handleLogin = async () => {
    if (!validateAuthForm('login')) return;
    setIsAuthSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const previousBase = OpenAPI.BASE;
      try {
        OpenAPI.BASE = inventoryBaseUrl;
        const res = await LoginService.loginCreate({
          username_or_email: authForm.username_or_email,
          password: authForm.password,
          session_key: getSessionKey(),
        });
        setPendingVerificationEmail(null);
        const token = (res as { token?: string })?.token;
        if (token) {
          setAuthToken(token);
        }
        trackLogin();
        onAuthSuccess?.();
      } finally {
        OpenAPI.BASE = previousBase;
      }
    } catch (err) {
      const message =
        (err as { body?: { detail?: string; error?: string } })?.body?.detail ||
        (err as { body?: { detail?: string; error?: string } })?.body?.error ||
        'Login failed. Please check your credentials.';
      if (String(message).toLowerCase().includes('verify your email')) {
        setAuthNotice('Please verify your email before logging in.');
        setPendingVerificationEmail(authForm.username_or_email.includes('@') ? authForm.username_or_email : null);
      } else {
        setAuthError(message);
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validateAuthForm('register')) return;
    setIsAuthSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const previousBase = OpenAPI.BASE;
      try {
        OpenAPI.BASE = inventoryBaseUrl;
        await RegisterService.registerCreate({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
        });
      } finally {
        OpenAPI.BASE = previousBase;
      }
      setAuthNotice('Verification email sent. Please verify your email, then sign in to continue.');
      setPendingVerificationEmail(authForm.email);
      setAuthMode('login');
      setAuthForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setAuthError('Registration failed. Please review details and try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setAuthError(null);
    setAuthNotice(null);
    setIsAuthSubmitting(true);
    try {
      const response = await fetch(`${inventoryBaseUrl}/verify-email/resend/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Brand-Code': brandConfig.code },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to resend verification email.');
      setAuthNotice(data?.message || 'Verification email sent.');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const utm = getStoredUTMParams();
      const utmParams = new URLSearchParams();
      if (utm.utm_source) utmParams.set('utm_source', utm.utm_source);
      if (utm.utm_medium) utmParams.set('utm_medium', utm.utm_medium);
      if (utm.utm_campaign) utmParams.set('utm_campaign', utm.utm_campaign);
      if (utm.utm_content) utmParams.set('utm_content', utm.utm_content);
      const nextParams = utmParams.toString();
      const callbackUrl = `${window.location.origin}/auth/callback${nextParams ? `?${nextParams}` : ''}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });
      if (error) {
        setAuthError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setAuthError('Failed to initiate Google sign in.');
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setGoogleLoading(true);
        const result = await exchangeSupabaseToken(session.access_token);
        if (result?.token) {
          trackLogin();
          onAuthSuccess?.();
        } else {
          setAuthError('Google sign in succeeded but could not complete authentication with the store.');
          setGoogleLoading(false);
        }
      }
    };
    handleAuthCallback();
  }, [onAuthSuccess]);

  return (
    <div className="auth-overlay">
      <div className="auth-overlay__backdrop" />
      <div className="auth-overlay__container">
        <div className="auth-overlay__panel">
          <div className="auth-overlay__logo">
            <Image
              src="/affordlogo1.svg"
              alt={`${brandConfig.name} logo`}
              width={80}
              height={80}
              className="auth-overlay__logo-image"
              priority
            />
          </div>

          <h1 className="auth-overlay__heading">{brandConfig.name}</h1>
          <p className="auth-overlay__text">
            Sign in or create an account to start browsing
          </p>

          <button
            type="button"
            className="auth-overlay__google"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isAuthSubmitting}
          >
            {googleLoading ? (
              <>
                <span className="auth-overlay__spinner" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="auth-overlay__google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="auth-overlay__divider">
            <span>or</span>
          </div>

          <div className="auth-overlay__auth-toggle">
            <button
              type="button"
              className={`auth-overlay__toggle-btn ${authMode === 'login' || !authMode ? 'auth-overlay__toggle-btn--active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); setAuthNotice(null); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-overlay__toggle-btn ${authMode === 'register' ? 'auth-overlay__toggle-btn--active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(null); setAuthNotice(null); }}
            >
              Create account
            </button>
          </div>

          {authMode === 'login' && (
            <div className="auth-overlay__form">
              <input
                type="text"
                placeholder="Email or Username"
                value={authForm.username_or_email}
                onChange={(e) => setAuthForm({ ...authForm, username_or_email: e.target.value })}
                className="auth-overlay__input"
              />
              {authFieldErrors.username_or_email && <span className="auth-overlay__error">{authFieldErrors.username_or_email}</span>}
              <div className="auth-overlay__password-wrap">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="auth-overlay__input"
                />
                <button type="button" className="auth-overlay__ghost" onClick={() => setShowLoginPassword((p) => !p)}>
                  {showLoginPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {authFieldErrors.password && <span className="auth-overlay__error">{authFieldErrors.password}</span>}
              <button
                type="button"
                className="auth-overlay__submit"
                onClick={handleLogin}
                disabled={isAuthSubmitting || !isLoginReady()}
              >
                {isAuthSubmitting ? <><span className="auth-overlay__spinner" /> Signing in...</> : 'Sign in'}
              </button>
            </div>
          )}

          {authMode === 'register' && (
            <div className="auth-overlay__form">
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                className="auth-overlay__input"
              />
              {authFieldErrors.username && <span className="auth-overlay__error">{authFieldErrors.username}</span>}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="auth-overlay__input"
              />
              {authFieldErrors.email && <span className="auth-overlay__error">{authFieldErrors.email}</span>}
              <div className="auth-overlay__password-wrap">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="auth-overlay__input"
                />
                <button type="button" className="auth-overlay__ghost" onClick={() => setShowRegisterPassword((p) => !p)}>
                  {showRegisterPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {authFieldErrors.password && <span className="auth-overlay__error">{authFieldErrors.password}</span>}
              <button
                type="button"
                className="auth-overlay__submit"
                onClick={handleRegister}
                disabled={isAuthSubmitting || !isRegisterReady()}
              >
                {isAuthSubmitting ? <><span className="auth-overlay__spinner" /> Creating account...</> : 'Create account'}
              </button>
            </div>
          )}

          {authNotice && (
            <div className="auth-overlay__alert auth-overlay__alert--success">
              {authNotice}
              {pendingVerificationEmail && (
                <div className="auth-overlay__resend">
                  <button type="button" className="auth-overlay__link" onClick={handleResendVerification} disabled={isAuthSubmitting}>
                    Resend verification email
                  </button>
                </div>
              )}
            </div>
          )}
          {authError && <div className="auth-overlay__alert">{authError}</div>}
        </div>
      </div>
    </div>
  );
}
