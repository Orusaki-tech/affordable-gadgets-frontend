export type SessionUser = {
  id?: number;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
  initials: string;
};

const AUTH_USER_KEY = 'auth_user';

function clean(value?: string | null) {
  const trimmed = (value || '').trim();
  return trimmed || null;
}

function titleCaseName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildSessionUser(input: {
  id?: number;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}): SessionUser {
  const email = clean(input.email);
  const username = clean(input.username);
  let firstName = clean(input.firstName);
  let lastName = clean(input.lastName);
  const fullName = clean(input.fullName);

  if ((!firstName || !lastName) && fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (!firstName && parts[0]) firstName = parts[0];
    if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
  }

  const fromNames = [firstName, lastName].filter(Boolean).join(' ');
  const emailLocal = email?.includes('@') ? email.split('@')[0] : null;
  const rawDisplay = fromNames || username || emailLocal || email || 'Signed in';
  const displayName = titleCaseName(rawDisplay.replace(/[._-]+/g, ' '));

  const initialSource = fromNames || displayName;
  const initials = initialSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  return {
    id: input.id,
    email,
    username,
    firstName,
    lastName,
    displayName,
    initials,
  };
}

export function getStoredSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed || typeof parsed !== 'object') return null;
    return buildSessionUser({
      id: parsed.id,
      email: parsed.email,
      username: parsed.username,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fullName: parsed.displayName,
    });
  } catch {
    return null;
  }
}

export function setStoredSessionUser(user: SessionUser | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY);
  } else {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event('auth-user-changed'));
}

export function clearStoredSessionUser() {
  setStoredSessionUser(null);
}
