import {
  getStudioProfile,
  getStudioUser,
  isStudioSuperuser,
  profileHasRole,
  type StudioProfile,
  type StudioUser,
} from '@/lib/studio/auth';

/**
 * Mirrors ops-admin RBAC for Visual Studio chrome.
 * Write rules follow inventory permissions used by the CRA admin.
 */
export type StudioCapabilities = {
  roleCodes: string[];
  roleLabel: string;
  canRead: boolean;

  canCreateProduct: boolean;
  canDeleteProduct: boolean;
  canFullEditProduct: boolean;
  canContentEditProduct: boolean;
  canManageProductMedia: boolean;

  canEditArticles: boolean;
  canEditPromotions: boolean;
  canEditBundles: boolean;
  canEditFinancing: boolean;
  canEditDeliveryRates: boolean;

  /** Human-readable list of what this session can edit in Studio. */
  editableSummary: string;
  readOnlyReason: string | null;

  /** @deprecated use canCreateProduct */
  canCreate: boolean;
  /** @deprecated use canDeleteProduct */
  canDelete: boolean;
  /** @deprecated use canFullEditProduct */
  canFullEdit: boolean;
  /** @deprecated prefer resource-specific flags */
  canContentEdit: boolean;
};

function roleNames(profile: StudioProfile | null, user: StudioUser | null): string[] {
  const codes: string[] = [];
  if (isStudioSuperuser(profile, user)) codes.push('SUPERUSER');
  if (profileHasRole(profile, 'IM')) codes.push('IM');
  if (profileHasRole(profile, 'CC')) codes.push('CC');
  if (profileHasRole(profile, 'MM')) codes.push('MM');
  if (profileHasRole(profile, 'SP')) codes.push('SP');
  if (profileHasRole(profile, 'OM')) codes.push('OM');
  if (profile?.is_global_admin) codes.push('GLOBAL');
  return codes;
}

function formatRoleLabel(codes: string[], profile: StudioProfile | null): string {
  if (codes.includes('SUPERUSER')) return 'Superuser';
  const display =
    profile?.roles
      ?.map((r) => (r as { display_name?: string }).display_name || r.name || r.role_code)
      .filter(Boolean)
      .join(', ') || '';
  if (display) return display;
  if (codes.includes('IM')) return 'Inventory Manager';
  if (codes.includes('CC')) return 'Content Creator';
  if (codes.includes('MM')) return 'Marketing Manager';
  if (codes.includes('OM')) return 'Order Manager';
  if (codes.includes('SP')) return 'Salesperson';
  return 'Staff';
}

export function getStudioCapabilities(
  profile: StudioProfile | null = getStudioProfile(),
  user: StudioUser | null = getStudioUser()
): StudioCapabilities {
  const codes = roleNames(profile, user);
  const superuser = codes.includes('SUPERUSER');
  const isIM = codes.includes('IM') || superuser;
  const isCC = codes.includes('CC') || superuser;
  const isMM = codes.includes('MM') || superuser || Boolean(profile?.is_global_admin);
  const isOM = codes.includes('OM') || superuser;
  const isSP = codes.includes('SP');

  const canCreateProduct = isIM;
  const canDeleteProduct = isIM;
  const canFullEditProduct = isIM;
  const canContentEditProduct = isCC || isIM;
  const canManageProductMedia = isCC || isIM;
  const canEditArticles = isCC || isIM;
  // Promotions: MM write; CC also allowed by API (IsContentCreator | MM)
  const canEditPromotions = isMM || isCC;
  const canEditBundles = isMM;
  const canEditFinancing = isIM;
  const canEditDeliveryRates = isOM;

  const editable: string[] = [];
  if (canFullEditProduct) editable.push('products (full)');
  else if (canContentEditProduct) editable.push('product content, images, videos');
  if (canEditArticles) editable.push('articles');
  if (canEditPromotions) editable.push('promotions');
  if (canEditBundles) editable.push('bundles');
  if (canEditFinancing) editable.push('financing');
  if (canEditDeliveryRates) editable.push('delivery rates');

  let readOnlyReason: string | null = null;
  if (editable.length === 0) {
    if (isSP) {
      readOnlyReason =
        'Sales staff have read-only Studio access. Use ops admin for reservations and leads.';
    } else {
      readOnlyReason = 'Your role has no write access in Visual Studio. Use ops admin for other tools.';
    }
  }

  const roleLabel = formatRoleLabel(codes, profile);

  return {
    roleCodes: codes,
    roleLabel,
    canRead: true,
    canCreateProduct,
    canDeleteProduct,
    canFullEditProduct,
    canContentEditProduct,
    canManageProductMedia,
    canEditArticles,
    canEditPromotions,
    canEditBundles,
    canEditFinancing,
    canEditDeliveryRates,
    editableSummary:
      editable.length > 0
        ? `Editing as ${roleLabel}: ${editable.join(', ')}`
        : `Signed in as ${roleLabel} (view only)`,
    readOnlyReason,
    // Back-compat aliases used by older chrome
    canCreate: canCreateProduct,
    canDelete: canDeleteProduct,
    canFullEdit: canFullEditProduct,
    canContentEdit: canContentEditProduct || canEditPromotions || canEditArticles,
  };
}
