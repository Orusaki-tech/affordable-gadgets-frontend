'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearStudioSession,
  getStudioProfile,
  getStudioToken,
  getStudioUser,
  setStudioSession,
  type StudioProfile,
  type StudioUser,
} from '@/lib/studio/auth';
import { studioLogin, StudioApiError } from '@/lib/studio/api';
import { getStudioCapabilities, type StudioCapabilities } from '@/lib/studio/permissions';

type StudioAuthContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  profile: StudioProfile | null;
  user: StudioUser | null;
  capabilities: StudioCapabilities;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshFromStorage: () => void;
};

const StudioAuthContext = createContext<StudioAuthContextValue | undefined>(undefined);

export function StudioAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [user, setUser] = useState<StudioUser | null>(null);

  const refreshFromStorage = useCallback(() => {
    setToken(getStudioToken());
    setProfile(getStudioProfile());
    setUser(getStudioUser());
  }, []);

  useEffect(() => {
    refreshFromStorage();
    setLoading(false);
    const onChange = () => refreshFromStorage();
    window.addEventListener('studio-auth-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('studio-auth-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refreshFromStorage]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await studioLogin(username, password);
      setStudioSession(result.token, result.profile);
      setToken(result.token);
      setProfile(result.profile);
      setUser(getStudioUser());
    } catch (err) {
      if (err instanceof StudioApiError) throw err;
      throw new StudioApiError(
        err instanceof Error ? err.message : 'Login failed',
        0,
        null
      );
    }
  }, []);

  const logout = useCallback(() => {
    clearStudioSession();
    setToken(null);
    setProfile(null);
    setUser(null);
  }, []);

  const capabilities = useMemo(
    () => getStudioCapabilities(profile, user),
    [profile, user]
  );

  const value = useMemo(
    () => ({
      loading,
      isAuthenticated: Boolean(token),
      token,
      profile,
      user,
      capabilities,
      login,
      logout,
      refreshFromStorage,
    }),
    [loading, token, profile, user, capabilities, login, logout, refreshFromStorage]
  );

  return (
    <StudioAuthContext.Provider value={value}>{children}</StudioAuthContext.Provider>
  );
}

export function useStudioAuth(): StudioAuthContextValue {
  const ctx = useContext(StudioAuthContext);
  if (!ctx) {
    throw new Error('useStudioAuth must be used within StudioAuthProvider');
  }
  return ctx;
}
