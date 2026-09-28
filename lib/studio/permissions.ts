import {
  getStudioProfile,
  getStudioUser,
  isStudioSuperuser,
  profileHasRole,
  type StudioProfile,
  type StudioUser,
} from '@/lib/studio/auth';

export type StudioCapabilities = {
  canRead: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canFullEdit: boolean;
  canContentEdit: boolean;
  readOnlyReason: string | null;
};

export function getStudioCapabilities(
  profile: StudioProfile | null = getStudioProfile(),
  user: StudioUser | null = getStudioUser()
): StudioCapabilities {
  const superuser = isStudioSuperuser(profile, user);
  const isIM = profileHasRole(profile, 'IM');
  const isCC = profileHasRole(profile, 'CC');
  const isMM = profileHasRole(profile, 'MM');
  const isSP = profileHasRole(profile, 'SP');

  if (superuser || isIM) {
    return {
      canRead: true,
      canCreate: true,
      canDelete: true,
      canFullEdit: true,
      canContentEdit: true,
      readOnlyReason: null,
    };
  }

  if (isCC) {
    return {
      canRead: true,
      canCreate: false,
      canDelete: false,
      canFullEdit: false,
      canContentEdit: true,
      readOnlyReason: null,
    };
  }

  if (isMM) {
    return {
      canRead: true,
      canCreate: false,
      canDelete: false,
      canFullEdit: false,
      canContentEdit: true,
      readOnlyReason: null,
    };
  }

  if (isSP) {
    return {
      canRead: true,
      canCreate: false,
      canDelete: false,
      canFullEdit: false,
      canContentEdit: false,
      readOnlyReason: 'Sales staff have read-only access in Studio. Use ops admin for reservations.',
    };
  }

  // Staff without recognized role — allow read, block writes
  return {
    canRead: true,
    canCreate: false,
    canDelete: false,
    canFullEdit: false,
    canContentEdit: false,
    readOnlyReason: 'Your role cannot edit products in Studio.',
  };
}
