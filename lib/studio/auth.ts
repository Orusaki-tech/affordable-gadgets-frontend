/** Staff studio auth — separate from customer `auth_token`. */

export const STUDIO_TOKEN_KEY = 'studio_token';
export const STUDIO_PROFILE_KEY = 'studio_profile';
export const STUDIO_USER_KEY = 'studio_user';

export type StudioRoleCode = 'IM' | 'CC' | 'MM' | 'SP' | 'OM' | string;

export type StudioProfile = {
  id?: number;
  username?: string;
  email?: string;
  is_global_admin?: boolean;
  roles?: Array<{ name?: string; role_code?: string }>;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    is_staff?: boolean;
    is_superuser?: boolean;
  };
};

export type StudioUser = {
  id?: number;
  username?: string;
  email?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

export function getStudioToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STUDIO_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStudioToken(token: string) {
  localStorage.setItem(STUDIO_TOKEN_KEY, token);
  window.dispatchEvent(new Event('studio-auth-changed'));
}

export function getStudioProfile(): StudioProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDIO_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StudioProfile) : null;
  } catch {
    return null;
  }
}

export function getStudioUser(): StudioUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDIO_USER_KEY);
    return raw ? (JSON.parse(raw) as StudioUser) : null;
  } catch {
    return null;
  }
}

export function setStudioSession(token: string, profile: StudioProfile) {
  setStudioToken(token);
  localStorage.setItem(STUDIO_PROFILE_KEY, JSON.stringify(profile));
  const user: StudioUser = {
    id: profile.user?.id ?? profile.id,
    username: profile.user?.username ?? profile.username,
    email: profile.user?.email ?? profile.email,
    is_staff: profile.user?.is_staff ?? true,
    is_superuser: profile.user?.is_superuser ?? false,
  };
  localStorage.setItem(STUDIO_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('studio-auth-changed'));
}

export function clearStudioSession() {
  localStorage.removeItem(STUDIO_TOKEN_KEY);
  localStorage.removeItem(STUDIO_PROFILE_KEY);
  localStorage.removeItem(STUDIO_USER_KEY);
  window.dispatchEvent(new Event('studio-auth-changed'));
}

export function profileHasRole(profile: StudioProfile | null, code: StudioRoleCode): boolean {
  if (!profile?.roles?.length) return false;
  return profile.roles.some(
    (role) => role.role_code === code || role.name === code
  );
}

export function isStudioSuperuser(profile: StudioProfile | null, user?: StudioUser | null): boolean {
  return (
    profile?.user?.is_superuser === true ||
    (profile as { is_superuser?: boolean } | null)?.is_superuser === true ||
    user?.is_superuser === true
  );
}
