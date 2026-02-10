'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LoginService, RegisterService } from '@/lib/api/generated';
import { setAuthToken } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';

interface AuthChoiceModalProps {
  onClose: () => void;
  onGuestProceed: () => void;
  onAuthSuccess: () => void;
  initialEmail?: string;
}

export function AuthChoiceModal({ onClose, onGuestProceed, onAuthSuccess, initialEmail }: AuthChoiceModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFieldErrors, setAuthFieldErrors] = useState<Record<string, string>>({});
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    username_or_email: '',
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!initialEmail) return;
    setAuthForm((prev) => ({
      ...prev,
      username_or_email: prev.username_or_email || initialEmail,
      email: prev.email || initialEmail,
      username: prev.username || initialEmail.split('@')[0],
    }));
  }, [initialEmail]);

  const openLogin = () => {
    setAuthError(null);
    setAuthFieldErrors({});
    setAuthMode('login');
  };

  const openRegister = () => {
    setAuthError(null);
    setAuthFieldErrors({});
    setAuthMode('register');
  };

  const validateAuthForm = (mode: 'login' | 'register') => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'login') {
      if (!authForm.username_or_email.trim()) {
        errors.username_or_email = 'Email or username is required.';
      }
      if (!authForm.password.trim()) {
        errors.password = 'Password is required.';
      }
    } else {
      if (!authForm.username.trim()) {
        errors.username = 'Username is required.';
      }
      if (!authForm.email.trim() || !emailRegex.test(authForm.email)) {
        errors.email = 'Valid email is required.';
      }
      if (!authForm.password.trim() || authForm.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
      }
    }

    setAuthFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isLoginReady = () => {
    return !!authForm.username_or_email.trim() && !!authForm.password.trim();
  };

  const isRegisterReady = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      !!authForm.username.trim() &&
      !!authForm.email.trim() &&
      emailRegex.test(authForm.email) &&
      authForm.password.length >= 8
    );
  };

  const handleLogin = async () => {
    if (!validateAuthForm('login')) return;
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await LoginService.loginCreate({
        username_or_email: authForm.username_or_email,
        password: authForm.password,
      });
      const token = (res as { token?: string })?.token;
      if (token) {
        setAuthToken(token);
      }
      onAuthSuccess();
      onClose();
    } catch (err) {
      setAuthError('Login failed. Please check your credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validateAuthForm('register')) return;
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await RegisterService.registerCreate({
        username: authForm.username,
        email: authForm.email,
        password: authForm.password,
      });
      const token = (res as { token?: string })?.token;
      if (token) {
        setAuthToken(token);
      }
      onAuthSuccess();
      onClose();
    } catch (err) {
      setAuthError('Registration failed. Please review details and try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleGuestProceed = () => {
    onGuestProceed();
    onClose();
  };

  return (
    <div className="checkout-modal">
      <div className="checkout-modal__panel">
        <button
          type="button"
          onClick={onClose}
          className="checkout-modal__close"
          aria-label="Close authentication"
        >
          <svg className="checkout-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="checkout-modal__logo checkout-modal__logo--small">
          <Image
            src="/affordablegadgetslogo.png"
            alt={`${brandConfig.name} logo`}
            width={100}
            height={100}
            className="checkout-modal__logo-image"
            priority
          />
        </div>

        <h2 className="checkout-modal__heading">Continue to Payment</h2>
        <p className="checkout-modal__text">
          Create an account for faster checkout and order tracking, or continue as a guest.
        </p>

        <div className="checkout-modal__auth">
          <div className="checkout-modal__auth-actions">
            <button type="button" className="checkout-modal__secondary" onClick={openLogin}>
              Sign in
            </button>
            <button type="button" className="checkout-modal__secondary" onClick={openRegister}>
              Create account
            </button>
          </div>

          <button type="button" className="checkout-modal__primary" onClick={handleGuestProceed} disabled={isAuthSubmitting}>
            Continue as guest
          </button>

          {authMode === 'login' && (
            <div className="checkout-modal__auth-form">
              <input
                type="text"
                placeholder="Email or Username"
                value={authForm.username_or_email}
                onChange={(e) => setAuthForm({ ...authForm, username_or_email: e.target.value })}
                className="checkout-modal__input"
              />
              {authFieldErrors.username_or_email && (
                <span className="checkout-modal__error">{authFieldErrors.username_or_email}</span>
              )}
              <input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="checkout-modal__input"
              />
              <button
                type="button"
                className="checkout-modal__ghost"
                onClick={() => setShowLoginPassword((prev) => !prev)}
              >
                {showLoginPassword ? 'Hide password' : 'Show password'}
              </button>
              {authFieldErrors.password && (
                <span className="checkout-modal__error">{authFieldErrors.password}</span>
              )}
              <button
                type="button"
                className="checkout-modal__primary"
                onClick={handleLogin}
                disabled={isAuthSubmitting || !isLoginReady()}
              >
                {isAuthSubmitting ? (
                  <>
                    <span className="checkout-modal__spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          )}

          {authMode === 'register' && (
            <div className="checkout-modal__auth-form">
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                className="checkout-modal__input"
              />
              {authFieldErrors.username && (
                <span className="checkout-modal__error">{authFieldErrors.username}</span>
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="checkout-modal__input"
              />
              {authFieldErrors.email && <span className="checkout-modal__error">{authFieldErrors.email}</span>}
              <input
                type={showRegisterPassword ? 'text' : 'password'}
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="checkout-modal__input"
              />
              <button
                type="button"
                className="checkout-modal__ghost"
                onClick={() => setShowRegisterPassword((prev) => !prev)}
              >
                {showRegisterPassword ? 'Hide password' : 'Show password'}
              </button>
              {authFieldErrors.password && (
                <span className="checkout-modal__error">{authFieldErrors.password}</span>
              )}
              <button
                type="button"
                className="checkout-modal__primary"
                onClick={handleRegister}
                disabled={isAuthSubmitting || !isRegisterReady()}
              >
                {isAuthSubmitting ? (
                  <>
                    <span className="checkout-modal__spinner" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          )}

          {authError && <div className="checkout-modal__alert">{authError}</div>}
        </div>
      </div>
    </div>
  );
}
