import { OpenAPI, ProfilesService } from '@/lib/api/generated';
import { inventoryBaseUrl } from '@/lib/api/openapi';
import { createClient } from '@/lib/supabase/client';
import {
  buildSessionUser,
  getStoredSessionUser,
  setStoredSessionUser,
  type SessionUser,
} from '@/lib/auth/session-user';

async function sessionUserFromSupabase(): Promise<Partial<SessionUser> & { fullName?: string | null } | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    const fullName =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      null;
    const firstName =
      (typeof meta.given_name === 'string' && meta.given_name) ||
      (typeof meta.first_name === 'string' && meta.first_name) ||
      null;
    const lastName =
      (typeof meta.family_name === 'string' && meta.family_name) ||
      (typeof meta.last_name === 'string' && meta.last_name) ||
      null;
    return {
      email: user.email,
      firstName,
      lastName,
      fullName,
    };
  } catch {
    return null;
  }
}

async function sessionUserFromProfile(): Promise<ReturnType<typeof buildSessionUser> | null> {
  const previousBase = OpenAPI.BASE;
  try {
    OpenAPI.BASE = inventoryBaseUrl;
    const profile = await ProfilesService.profilesCustomerRetrieve();
    return buildSessionUser({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      firstName: profile.first_name,
      lastName: profile.last_name,
    });
  } catch {
    return null;
  } finally {
    OpenAPI.BASE = previousBase;
  }
}

/** Resolve the best display identity for the signed-in shopper and cache it. */
export async function refreshSessionUser(): Promise<SessionUser | null> {
  if (typeof window === 'undefined') return null;
  if (!localStorage.getItem('auth_token')) {
    setStoredSessionUser(null);
    return null;
  }

  const cached = getStoredSessionUser();
  const [profileUser, supabaseUser] = await Promise.all([
    sessionUserFromProfile(),
    sessionUserFromSupabase(),
  ]);

  const next = buildSessionUser({
    id: profileUser?.id ?? cached?.id,
    email: profileUser?.email || supabaseUser?.email || cached?.email,
    username: profileUser?.username || cached?.username,
    firstName: profileUser?.firstName || supabaseUser?.firstName || cached?.firstName,
    lastName: profileUser?.lastName || supabaseUser?.lastName || cached?.lastName,
    fullName: supabaseUser?.fullName || cached?.displayName,
  });

  setStoredSessionUser(next);
  return next;
}
