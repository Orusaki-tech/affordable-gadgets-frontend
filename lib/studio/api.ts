import { brandConfig } from '@/lib/config/brand';
import { getStudioToken, clearStudioSession, type StudioProfile } from '@/lib/studio/auth';

const apiRoot = () => brandConfig.apiBaseUrl.replace(/\/+$/, '');

export function studioInventoryBase(): string {
  return `${apiRoot()}/api/inventory`;
}

export function studioAuthLoginUrl(): string {
  return `${apiRoot()}/api/auth/token/login/`;
}

export class StudioApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'StudioApiError';
    this.status = status;
    this.body = body;
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.startsWith('<') || /<!doctype/i.test(trimmed)) {
      return 'Server returned HTML instead of JSON. Check API host / CORS.';
    }
    return trimmed || fallback;
  }
  if (typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.non_field_errors) && obj.non_field_errors[0]) {
      return String(obj.non_field_errors[0]);
    }
    if (typeof obj.detail === 'string') return obj.detail;
    if (Array.isArray(obj.detail) && obj.detail[0]) return String(obj.detail[0]);
    if (typeof obj.message === 'string') return obj.message;
    const fieldLabels: Record<string, string> = {
      meta_title: 'Meta title',
      meta_description: 'Meta description',
      seo_title: 'SEO title',
      seo_description: 'SEO description',
      product_name: 'Product name',
      brand: 'Brand',
      model_series: 'Model series',
      slug: 'Slug',
      keywords: 'Keywords',
      headline: 'Headline',
      title: 'Title',
      name: 'Name',
      code: 'Code',
      promotion_code: 'Promotion code',
      listing_brand: 'Listing brand',
      county: 'County',
      ward: 'Ward',
      description: 'Description',
    };
    for (const [key, value] of Object.entries(obj)) {
      const msg = Array.isArray(value) && value[0] ? String(value[0]) : typeof value === 'string' ? value : null;
      if (!msg) continue;
      const label = fieldLabels[key] || key.replace(/_/g, ' ');
      return `${label}: ${msg}`;
    }
  }
  return fallback;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function studioLogin(
  username: string,
  password: string
): Promise<{ token: string; profile: StudioProfile }> {
  const formData = new URLSearchParams();
  formData.set('username', username);
  formData.set('password', password);

  const res = await fetch(studioAuthLoginUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'ngrok-skip-browser-warning': '1',
    },
    body: formData.toString(),
    cache: 'no-store',
  });

  const body = await parseBody(res);
  if (!res.ok) {
    throw new StudioApiError(messageFromBody(body, 'Login failed'), res.status, body);
  }

  const token = (body as { token?: string })?.token;
  if (!token) {
    throw new StudioApiError('Login failed: no token received', res.status, body);
  }

  let profile =
    (body as { profile?: StudioProfile; admin_profile?: StudioProfile })?.profile ??
    (body as { admin_profile?: StudioProfile })?.admin_profile;

  if (!profile) {
    profile = await studioFetchJson<StudioProfile>('/profiles/admin/', {
      tokenOverride: token,
    });
  }

  return { token, profile };
}

type StudioFetchOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
  tokenOverride?: string;
  /** When true, do not set Content-Type (for FormData). */
  multipart?: boolean;
};

export async function studioFetch(
  path: string,
  options: StudioFetchOptions = {}
): Promise<Response> {
  const token = options.tokenOverride ?? getStudioToken();
  if (!token) {
    throw new StudioApiError('Not authenticated', 401, null);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Brand-Code': brandConfig.code,
    'ngrok-skip-browser-warning': '1',
    Authorization: `Token ${token}`,
    ...(options.headers || {}),
  };

  if (!options.multipart && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = path.startsWith('http')
    ? path
    : `${studioInventoryBase()}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    credentials: 'omit',
    cache: 'no-store',
  });

  if (res.status === 401) {
    clearStudioSession();
  }

  return res;
}

export async function studioFetchJson<T>(
  path: string,
  options: StudioFetchOptions = {}
): Promise<T> {
  const res = await studioFetch(path, options);
  const body = await parseBody(res);
  if (!res.ok) {
    throw new StudioApiError(
      messageFromBody(body, `Request failed (${res.status})`),
      res.status,
      body
    );
  }
  return body as T;
}

export type StudioProduct = {
  id: number;
  product_name: string;
  product_type?: string;
  product_type_display?: string;
  brand?: string;
  model_series?: string;
  product_description?: string;
  long_description?: string;
  default_selling_price?: string | null;
  is_published?: boolean;
  is_discontinued?: boolean;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  product_highlights?: unknown;
  available_stock?: number;
  seo_score?: number;
  images?: Array<{
    id?: number;
    image_url?: string;
    image?: string;
    is_primary?: boolean;
    alt_text?: string;
    display_order?: number;
  }>;
  videos?: Array<{
    id?: number;
    url?: string;
    title?: string;
    display_order?: number;
  }>;
  product_video_url?: string | null;
  product_video_file_url?: string | null;
  og_image_url?: string | null;
  primary_image?: string | null;
  tags?: Array<{ id?: number; name?: string; slug?: string }>;
};

export type StudioPaginatedProducts = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudioProduct[];
};

export function studioProductImageUrl(product: StudioProduct): string | null {
  const images = product.images || [];
  const primary =
    images.find((img) => img.is_primary) || images[0] || null;
  const raw =
    product.primary_image ||
    primary?.image_url ||
    primary?.image ||
    product.og_image_url ||
    null;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${apiRoot()}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export async function listStudioProducts(params: {
  page?: number;
  search?: string;
  /** Filter by tag name or slug (Featured, video, …). */
  tag?: string;
  pageSize?: number;
}): Promise<StudioPaginatedProducts> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.tag?.trim()) query.set('tag', params.tag.trim());
  query.set('page_size', String(params.pageSize ?? 50));
  const qs = query.toString();
  return studioFetchJson<StudioPaginatedProducts>(`/products/?${qs}`);
}

export async function retrieveStudioProduct(id: number): Promise<StudioProduct> {
  return studioFetchJson<StudioProduct>(`/products/${id}/`);
}

export async function createStudioProduct(
  data: Record<
    string,
    string | Blob | boolean | number | null | undefined | Record<string, unknown> | unknown[]
  >
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    appendFormValue(form, key, value);
  });
  return studioFetchJson<StudioProduct>('/products/', {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export async function patchStudioProduct(
  id: number,
  data: Record<
    string,
    string | Blob | boolean | number | null | undefined | Record<string, unknown> | unknown[]
  >
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => appendFormValue(form, key, value));
  return studioFetchJson<StudioProduct>(`/products/${id}/`, {
    method: 'PATCH',
    body: form,
    multipart: true,
  });
}

export async function updateStudioProductContent(
  id: number,
  data: Record<
    string,
    string | Blob | boolean | number | null | undefined | Record<string, unknown> | unknown[]
  >
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => appendFormValue(form, key, value));
  return studioFetchJson<StudioProduct>(`/products/${id}/update_content/`, {
    method: 'PATCH',
    body: form,
    multipart: true,
  });
}

export async function deleteStudioProduct(id: number): Promise<void> {
  await studioDelete(`/products/${id}/`);
}

async function studioDelete(path: string): Promise<void> {
  const res = await studioFetch(path, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const body = await parseBody(res);
    throw new StudioApiError(
      messageFromBody(body, `Delete failed (${res.status})`),
      res.status,
      body
    );
  }
}

export type StudioProductImage = {
  id: number;
  image_url?: string | null;
  image?: string | null;
  is_primary?: boolean;
  alt_text?: string;
  display_order?: number;
};

function appendFormValue(
  form: FormData,
  key: string,
  value:
    | string
    | Blob
    | boolean
    | number
    | null
    | undefined
    | Record<string, unknown>
    | unknown[]
) {
  // Match admin multipart behavior: omit null/undefined so DRF does not
  // try to coerce empty strings into decimals / FKs.
  if (value === undefined || value === null) return;
  if (typeof value === 'boolean') {
    form.append(key, value ? 'true' : 'false');
    return;
  }
  if (typeof value === 'object' && !(value instanceof Blob)) {
    form.append(key, JSON.stringify(value));
    return;
  }
  if (value === '') return;
  form.append(key, value as string | Blob);
}

export async function uploadStudioProductImages(
  productId: number,
  files: File[],
  options?: { makePrimary?: boolean; altText?: string }
): Promise<StudioProductImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append('images', file));
  if (options?.makePrimary) form.append('make_primary', 'true');
  if (options?.altText) form.append('alt_text', options.altText);
  return studioFetchJson<StudioProductImage[]>(`/products/${productId}/images/upload/`, {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export async function setStudioProductPrimaryImage(
  productId: number,
  imageId: number
): Promise<void> {
  await studioFetchJson(`/products/${productId}/images/set-primary/`, {
    method: 'POST',
    body: JSON.stringify({ image_id: imageId }),
  });
}

export async function deleteStudioProductImages(
  productId: number,
  imageIds: number[]
): Promise<void> {
  await studioFetchJson(`/products/${productId}/images/delete/`, {
    method: 'POST',
    body: JSON.stringify({ image_ids: imageIds }),
  });
}

export function resolveStudioImageUrl(
  raw?: string | null,
  fallbacks?: Array<string | null | undefined>
): string | null {
  const candidates = [raw, ...(fallbacks || [])].filter(Boolean) as string[];
  const first = candidates[0];
  if (!first) return null;
  if (first.startsWith('http') || first.startsWith('blob:')) return first;
  return `${apiRoot()}${first.startsWith('/') ? first : `/${first}`}`;
}

export type StudioArticle = {
  id: number;
  slug?: string;
  category?: string;
  headline?: string;
  body?: string;
  seo_title?: string;
  seo_description?: string;
  is_published?: boolean;
  is_primary?: boolean;
  product?: number | null;
  product_name?: string | null;
  product_slug?: string | null;
  products?: Array<{ id?: number; product_name?: string; slug?: string } | number>;
  thumbnail_image?: string | null;
  tags?: Array<{ id?: number; name?: string; slug?: string }>;
};

export type StudioPaginatedArticles = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudioArticle[];
};

export async function listStudioArticles(params: {
  page?: number;
  search?: string;
  publishedOnly?: boolean;
  tag?: string;
}): Promise<StudioPaginatedArticles> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.publishedOnly) query.set('is_published', 'true');
  if (params.tag?.trim()) query.set('tag', params.tag.trim());
  query.set('page_size', '50');
  query.set('ordering', '-updated_at');
  return studioFetchJson<StudioPaginatedArticles>(`/articles/?${query.toString()}`);
}

export async function retrieveStudioArticle(id: number): Promise<StudioArticle> {
  return studioFetchJson<StudioArticle>(`/articles/${id}/`);
}

export async function createStudioArticle(
  data: Record<string, string | Blob | boolean | number | null | undefined | number[]>
): Promise<StudioArticle> {
  const hasFile = Object.values(data).some(
    (value) => typeof Blob !== 'undefined' && value instanceof Blob
  );
  if (hasFile) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'product_ids' && Array.isArray(value)) {
        value.forEach((id) => form.append('product_ids', String(id)));
        return;
      }
      appendFormValue(form, key, value);
    });
    return studioFetchJson<StudioArticle>('/articles/', {
      method: 'POST',
      body: form,
      multipart: true,
    });
  }
  return studioFetchJson<StudioArticle>('/articles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioArticle(id: number): Promise<void> {
  await studioDelete(`/articles/${id}/`);
}

export async function findStudioArticleBySlug(slug: string): Promise<StudioArticle | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const data = await studioFetchJson<StudioPaginatedArticles>(
    `/articles/?search=${encodeURIComponent(trimmed)}&page_size=50`
  );
  return data.results.find((article) => article.slug === trimmed) ?? data.results[0] ?? null;
}

export async function patchStudioArticle(
  id: number,
  data: Record<string, string | Blob | boolean | number | null | undefined | number[]>
): Promise<StudioArticle> {
  const hasFile = Object.values(data).some((value) => typeof Blob !== 'undefined' && value instanceof Blob);
  if (hasFile) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'product_ids' && Array.isArray(value)) {
        value.forEach((pid) => form.append('product_ids', String(pid)));
        return;
      }
      appendFormValue(form, key, value);
    });
    return studioFetchJson<StudioArticle>(`/articles/${id}/`, {
      method: 'PATCH',
      body: form,
      multipart: true,
    });
  }
  return studioFetchJson<StudioArticle>(`/articles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function studioArticleHasTag(
  article: StudioArticle,
  tagName: string,
  tagId?: number
): boolean {
  const tags = article.tags || [];
  return tags.some((tag) => {
    if (tagId != null && tag.id === tagId) return true;
    return (
      tag.name?.toLowerCase() === tagName.toLowerCase() ||
      tag.slug?.toLowerCase() === tagName.toLowerCase()
    );
  });
}

/**
 * Add or remove a named tag on an article.
 * Removal matches by tag id OR name/slug so duplicate tag rows still clear.
 */
export async function setStudioArticleTagged(
  articleId: number,
  options: { tagName: string; tagSlug: string; enabled: boolean; tagId?: number }
): Promise<StudioArticle> {
  const ensured = options.tagId
    ? { id: options.tagId, name: options.tagName, slug: options.tagSlug }
    : await ensureStudioTag(options.tagName, options.tagSlug);
  if (!ensured.id) {
    throw new StudioApiError('Tag is missing an id', 400, ensured);
  }
  const article = await retrieveStudioArticle(articleId);
  const currentTags = article.tags || [];
  const matchesTarget = (tag: { id?: number; name?: string; slug?: string }) => {
    if (tag.id != null && tag.id === ensured.id) return true;
    const name = tag.name?.toLowerCase() || '';
    const slug = tag.slug?.toLowerCase() || '';
    return (
      name === options.tagName.toLowerCase() ||
      slug === options.tagSlug.toLowerCase() ||
      slug === options.tagName.toLowerCase()
    );
  };
  const next = options.enabled
    ? Array.from(
        new Set([
          ...currentTags.map((t) => t.id).filter((id): id is number => typeof id === 'number'),
          ensured.id,
        ])
      )
    : currentTags
        .filter((t) => !matchesTarget(t))
        .map((t) => t.id)
        .filter((id): id is number => typeof id === 'number');
  const saved = await patchStudioArticle(articleId, { tag_ids: next });
  // Prefer the write response; if tags omitted, re-fetch to confirm.
  if (saved.tags == null) {
    return retrieveStudioArticle(articleId);
  }
  return saved;
}

export type StudioPromotion = {
  id: number;
  title?: string;
  description?: string;
  is_active?: boolean;
  discount_percentage?: string | number | null;
  discount_amount?: string | number | null;
  start_date?: string;
  end_date?: string | null;
  banner_image?: string | null;
  banner_image_url?: string | null;
  display_locations?: string[] | string | null;
  listing_brand?: string | null;
  carousel_position?: number | null;
  featured_product?: number | null;
  featured_sale_price?: string | number | null;
  product_types?: string | null;
  products?: number[];
  promotion_code?: string | null;
  promotion_type?: number | null;
  promotion_type_name?: string | null;
  brand?: number | null;
  brand_name?: string | null;
};

export type StudioPromotionType = {
  id: number;
  name: string;
  code?: string;
  is_active?: boolean;
  display_order?: number;
};

export async function listStudioPromotionTypes(): Promise<StudioPromotionType[]> {
  const data = await studioFetchJson<
    StudioPromotionType[] | { results?: StudioPromotionType[] }
  >('/promotion-types/?page_size=100');
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createStudioPromotionType(data: {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}): Promise<StudioPromotionType> {
  return studioFetchJson<StudioPromotionType>('/promotion-types/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioPromotionType(
  id: number,
  data: Partial<{
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    display_order: number;
  }>
): Promise<StudioPromotionType> {
  return studioFetchJson<StudioPromotionType>(`/promotion-types/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioPromotionType(id: number): Promise<void> {
  await studioDelete(`/promotion-types/${id}/`);
}

export async function deleteStudioPromotion(id: number): Promise<void> {
  await studioDelete(`/promotions/${id}/`);
}

export async function listStudioPromotions(params?: {
  page?: number;
  is_active?: boolean;
}): Promise<{ count: number; results: StudioPromotion[]; next: string | null }> {
  const query = new URLSearchParams();
  query.set('page_size', '100');
  if (params?.page) query.set('page', String(params.page));
  if (params?.is_active != null) query.set('is_active', params.is_active ? 'true' : 'false');
  return studioFetchJson(`/promotions/?${query.toString()}`);
}

export async function retrieveStudioPromotion(id: number): Promise<StudioPromotion> {
  return studioFetchJson<StudioPromotion>(`/promotions/${id}/`);
}

export async function createStudioPromotion(
  data: Record<
    string,
    string | Blob | boolean | number | null | undefined | string[] | number[]
  >
): Promise<StudioPromotion> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'products' && Array.isArray(value)) {
      value.forEach((id) => form.append('products', String(id)));
      return;
    }
    appendFormValue(form, key, value);
  });
  return studioFetchJson<StudioPromotion>('/promotions/', {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export async function patchStudioPromotion(
  id: number,
  data: Record<
    string,
    | string
    | Blob
    | boolean
    | number
    | null
    | undefined
    | Record<string, unknown>
    | unknown[]
    | number[]
  >
): Promise<StudioPromotion> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'products' && Array.isArray(value)) {
      value.forEach((id) => form.append('products', String(id)));
      return;
    }
    appendFormValue(form, key, value);
  });
  return studioFetchJson<StudioPromotion>(`/promotions/${id}/`, {
    method: 'PATCH',
    body: form,
    multipart: true,
  });
}

export function brandBannerPromotionCode(brandFilter: string): string {
  const slug = brandFilter.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `BRAND-BANNER-${slug}`.toUpperCase();
}

export function studioPromotionHasLocation(promotion: StudioPromotion, location: string): boolean {
  const raw = promotion.display_locations;
  const list = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string'
      ? raw.split(',').map((s) => s.trim())
      : [];
  return list.includes(location);
}

export async function findStudioBrandBannerPromotion(
  brandFilter: string
): Promise<StudioPromotion | null> {
  const code = brandBannerPromotionCode(brandFilter);
  const data = await listStudioPromotions({ page: 1 });
  const results = data.results ?? [];
  const byCode = results.find((p) => (p.promotion_code || '').toUpperCase() === code);
  if (byCode) return byCode;
  const needle = brandFilter.trim().toLowerCase();
  return (
    results.find(
      (p) =>
        studioPromotionHasLocation(p, 'brand_banner') &&
        (p.listing_brand || '').trim().toLowerCase() === needle
    ) ?? null
  );
}

export type StudioBundleItem = {
  id: number;
  bundle?: number;
  product: number;
  product_name?: string;
  product_slug?: string;
  quantity?: number;
  override_price?: string | number | null;
  display_order?: number;
};

export type StudioBundle = {
  id: number;
  title?: string;
  description?: string;
  is_active?: boolean;
  pricing_mode?: string;
  bundle_price?: string | number | null;
  discount_percentage?: string | number | null;
  discount_amount?: string | number | null;
  show_in_listings?: boolean;
  main_product?: number | null;
  main_product_name?: string | null;
  items?: StudioBundleItem[];
  brand?: number | null;
};

export async function listStudioBundles(params?: {
  page?: number;
}): Promise<{ count: number; results: StudioBundle[]; next: string | null }> {
  const query = new URLSearchParams();
  query.set('page_size', '100');
  if (params?.page) query.set('page', String(params.page));
  return studioFetchJson(`/bundles/?${query.toString()}`);
}

export async function retrieveStudioBundle(id: number): Promise<StudioBundle> {
  return studioFetchJson<StudioBundle>(`/bundles/${id}/`);
}

export async function createStudioBundle(
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioBundle> {
  return studioFetchJson<StudioBundle>('/bundles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioBundle(
  id: number,
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioBundle> {
  return studioFetchJson<StudioBundle>(`/bundles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioBundle(id: number): Promise<void> {
  await studioDelete(`/bundles/${id}/`);
}

export async function listStudioBundleItems(bundleId: number): Promise<StudioBundleItem[]> {
  const data = await studioFetchJson<StudioBundleItem[] | { results?: StudioBundleItem[] }>(
    `/bundle-items/?bundle=${bundleId}&page_size=100`
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createStudioBundleItem(data: {
  bundle: number;
  product: number;
  quantity?: number;
  override_price?: string | number | null;
  display_order?: number;
}): Promise<StudioBundleItem> {
  return studioFetchJson<StudioBundleItem>('/bundle-items/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioBundleItem(
  id: number,
  data: Partial<{
    product: number;
    quantity: number;
    override_price: string | number | null;
    display_order: number;
  }>
): Promise<StudioBundleItem> {
  return studioFetchJson<StudioBundleItem>(`/bundle-items/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioBundleItem(id: number): Promise<void> {
  await studioDelete(`/bundle-items/${id}/`);
}

export type StudioFinancingProvider = {
  id: number;
  name?: string;
  slug?: string;
  is_active?: boolean;
  logo?: string | null;
  logo_url?: string | null;
};

export async function listStudioFinancingProviders(): Promise<StudioFinancingProvider[]> {
  const data = await studioFetchJson<{ results?: StudioFinancingProvider[] } | StudioFinancingProvider[]>(
    '/financing-providers/'
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function retrieveStudioFinancingProvider(
  id: number
): Promise<StudioFinancingProvider> {
  return studioFetchJson<StudioFinancingProvider>(`/financing-providers/${id}/`);
}

export async function patchStudioFinancingProvider(
  id: number,
  data: Record<string, string | Blob | boolean | number | null | undefined>
): Promise<StudioFinancingProvider> {
  const hasFile = Object.values(data).some(
    (value) => typeof Blob !== 'undefined' && value instanceof Blob
  );
  if (hasFile) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => appendFormValue(form, key, value));
    return studioFetchJson<StudioFinancingProvider>(`/financing-providers/${id}/`, {
      method: 'PATCH',
      body: form,
      multipart: true,
    });
  }
  return studioFetchJson<StudioFinancingProvider>(`/financing-providers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export type StudioFinancingOffer = {
  id: number;
  provider: number;
  provider_name?: string;
  product: number;
  product_name?: string;
  deposit_amount?: string | number;
  retail_amount?: string | number;
  term_unit?: 'day' | 'week' | 'month' | null;
  term_count?: number | null;
  daily_payment?: string | number | null;
  weekly_payment?: string | number | null;
  monthly_payment?: string | number | null;
  ram_gb?: number | null;
  rom_gb?: number | null;
  is_active?: boolean;
};

export async function listStudioFinancingOffers(params?: {
  provider?: number;
  product?: number;
  page?: number;
}): Promise<StudioFinancingOffer[]> {
  const query = new URLSearchParams();
  query.set('page_size', '100');
  if (params?.page) query.set('page', String(params.page));
  if (params?.provider) query.set('provider', String(params.provider));
  if (params?.product) query.set('product', String(params.product));
  const data = await studioFetchJson<
    StudioFinancingOffer[] | { results?: StudioFinancingOffer[] }
  >(`/financing-offers/?${query.toString()}`);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createStudioFinancingOffer(
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioFinancingOffer> {
  return studioFetchJson<StudioFinancingOffer>('/financing-offers/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioFinancingOffer(
  id: number,
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioFinancingOffer> {
  return studioFetchJson<StudioFinancingOffer>(`/financing-offers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioFinancingOffer(id: number): Promise<void> {
  await studioDelete(`/financing-offers/${id}/`);
}

export type StudioDeliveryRate = {
  id: number;
  county?: string;
  ward?: string | null;
  price?: string | number;
  is_active?: boolean;
};

export async function retrieveStudioDeliveryRate(id: number): Promise<StudioDeliveryRate> {
  return studioFetchJson<StudioDeliveryRate>(`/delivery-rates/${id}/`);
}

export async function listStudioDeliveryRates(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ count: number; results: StudioDeliveryRate[]; next: string | null }> {
  const query = new URLSearchParams();
  query.set('page_size', String(params?.pageSize ?? 100));
  if (params?.page) query.set('page', String(params.page));
  return studioFetchJson(`/delivery-rates/?${query.toString()}`);
}

/** Fetch every delivery rate (API is paginated; Studio needs the full list to manage). */
export async function listAllStudioDeliveryRates(): Promise<StudioDeliveryRate[]> {
  const pageSize = 200;
  const first = await listStudioDeliveryRates({ page: 1, pageSize });
  const results = [...(first.results ?? [])];
  let next = first.next;
  let page = 2;
  // Cap pages so a broken next URL cannot loop forever.
  while (next && page <= 50) {
    const data = await listStudioDeliveryRates({ page, pageSize });
    results.push(...(data.results ?? []));
    next = data.next;
    page += 1;
  }
  return results;
}

export async function createStudioDeliveryRate(
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioDeliveryRate> {
  return studioFetchJson<StudioDeliveryRate>('/delivery-rates/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioDeliveryRate(
  id: number,
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioDeliveryRate> {
  return studioFetchJson<StudioDeliveryRate>(`/delivery-rates/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioDeliveryRate(id: number): Promise<void> {
  await studioDelete(`/delivery-rates/${id}/`);
}

export type StudioProductVariant = {
  id: number;
  product?: number;
  product_id?: number;
  storage_gb?: number | null;
  ram_gb?: number | null;
  default_selling_price?: string | number;
  default_cost_of_unit?: string | number;
  is_active?: boolean;
};

export async function listStudioProductVariants(productId: number): Promise<StudioProductVariant[]> {
  const data = await studioFetchJson<
    StudioProductVariant[] | { results?: StudioProductVariant[] }
  >(`/variants/?product=${productId}&page_size=100`);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createStudioProductVariant(data: {
  product_id: number;
  storage_gb?: number | null;
  ram_gb?: number | null;
  default_selling_price: string | number;
  default_cost_of_unit?: string | number;
  is_active?: boolean;
}): Promise<StudioProductVariant> {
  return studioFetchJson<StudioProductVariant>('/variants/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioProductVariant(
  id: number,
  data: Partial<{
    storage_gb: number | null;
    ram_gb: number | null;
    default_selling_price: string | number;
    default_cost_of_unit: string | number;
    is_active: boolean;
  }>
): Promise<StudioProductVariant> {
  return studioFetchJson<StudioProductVariant>(`/variants/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioProductVariant(id: number): Promise<void> {
  await studioDelete(`/variants/${id}/`);
}

export type StudioProductAccessoryLink = {
  id: number;
  main_product: number;
  accessory: number;
  accessory_name?: string;
  required_quantity?: number;
};

export async function listStudioProductAccessories(
  mainProductId: number
): Promise<StudioProductAccessoryLink[]> {
  const data = await studioFetchJson<
    StudioProductAccessoryLink[] | { results?: StudioProductAccessoryLink[] }
  >(`/accessories-link/?main_product=${mainProductId}&page_size=100`);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function createStudioProductAccessory(data: {
  main_product: number;
  accessory: number;
  required_quantity?: number;
}): Promise<StudioProductAccessoryLink> {
  return studioFetchJson<StudioProductAccessoryLink>('/accessories-link/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioProductAccessory(id: number): Promise<void> {
  await studioDelete(`/accessories-link/${id}/`);
}

export type StudioReview = {
  id: number;
  product: number;
  product_name?: string;
  rating: number;
  comment?: string;
  product_condition?: string | null;
  purchase_date?: string | null;
  customer_username?: string | null;
  is_admin_review?: boolean;
  date_posted?: string;
};

export async function listStudioReviews(params?: {
  product?: number;
  search?: string;
  page?: number;
}): Promise<{ count: number; results: StudioReview[]; next: string | null }> {
  const query = new URLSearchParams();
  query.set('page_size', '50');
  if (params?.page) query.set('page', String(params.page));
  if (params?.product) query.set('product', String(params.product));
  if (params?.search?.trim()) query.set('search', params.search.trim());
  return studioFetchJson(`/reviews/?${query.toString()}`);
}

export async function createStudioReview(data: {
  product: number;
  rating: number;
  comment?: string;
  product_condition?: string | null;
  purchase_date?: string | null;
}): Promise<StudioReview> {
  return studioFetchJson<StudioReview>('/reviews/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function patchStudioReview(
  id: number,
  data: Partial<{
    rating: number;
    comment: string;
    product_condition: string | null;
    purchase_date: string | null;
  }>
): Promise<StudioReview> {
  return studioFetchJson<StudioReview>(`/reviews/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStudioReview(id: number): Promise<void> {
  await studioDelete(`/reviews/${id}/`);
}

export async function bulkStudioReviewAction(
  action: 'delete' | 'hide' | 'approve' | 'reject',
  reviewIds: number[]
): Promise<{ message?: string }> {
  return studioFetchJson('/reviews/bulk_action/', {
    method: 'POST',
    body: JSON.stringify({ action, review_ids: reviewIds }),
  });
}

export type StudioBrand = {
  id: number;
  code?: string;
  name?: string;
  is_active?: boolean;
};

export async function listStudioBrands(): Promise<StudioBrand[]> {
  const data = await studioFetchJson<StudioBrand[] | { results?: StudioBrand[] }>(
    '/brands/?page_size=100'
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

/** Resolve the storefront brand id for create payloads (promotions / bundles). */
export async function resolveStudioDefaultBrandId(): Promise<number> {
  const brands = await listStudioBrands();
  const code = brandConfig.code;
  const match =
    brands.find((b) => (b.code || '').toUpperCase() === code.toUpperCase() && b.is_active !== false) ||
    brands.find((b) => b.is_active !== false) ||
    brands[0];
  if (!match?.id) {
    throw new StudioApiError('No brand is available for Studio creates', 400, null);
  }
  return match.id;
}

export type StudioTag = {
  id: number;
  name?: string;
  slug?: string;
};

export async function listStudioTags(): Promise<StudioTag[]> {
  const data = await studioFetchJson<StudioTag[] | { results?: StudioTag[] }>('/tags/');
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function ensureStudioTag(name: string, slug: string): Promise<StudioTag> {
  const tags = await listStudioTags();
  const existing = tags.find(
    (tag) =>
      tag.name?.toLowerCase() === name.toLowerCase() ||
      tag.slug?.toLowerCase() === slug.toLowerCase()
  );
  if (existing?.id) return existing;
  try {
    return await studioFetchJson<StudioTag>('/tags/', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
  } catch (err) {
    // Race / duplicate slug — re-list and reuse.
    const again = await listStudioTags();
    const found = again.find(
      (tag) =>
        tag.name?.toLowerCase() === name.toLowerCase() ||
        tag.slug?.toLowerCase() === slug.toLowerCase()
    );
    if (found?.id) return found;
    throw err;
  }
}

export async function ensureStudioFeaturedTag(): Promise<StudioTag> {
  return ensureStudioTag('Featured', 'featured');
}

export async function ensureStudioVideoTag(): Promise<StudioTag> {
  return ensureStudioTag('Video', 'video');
}

export function studioProductHasTag(
  product: StudioProduct,
  tagName: string,
  tagId?: number
): boolean {
  const tags = product.tags || [];
  return tags.some((tag) => {
    if (tagId != null && tag.id === tagId) return true;
    return (
      tag.name?.toLowerCase() === tagName.toLowerCase() ||
      tag.slug?.toLowerCase() === tagName.toLowerCase()
    );
  });
}

export function studioProductHasFeaturedTag(product: StudioProduct, featuredTagId?: number): boolean {
  return studioProductHasTag(product, 'Featured', featuredTagId);
}

/** Set product tags via update_content (CC/IM). Replaces the full tag set. */
export async function setStudioProductTagIds(
  productId: number,
  tagIds: number[]
): Promise<StudioProduct> {
  return studioFetchJson<StudioProduct>(`/products/${productId}/update_content/`, {
    method: 'PATCH',
    body: JSON.stringify({ tag_ids: tagIds }),
  });
}

/**
 * Add or remove a named tag on a product.
 * Removal prefers remove_tags (by name/slug); falls back to update_content tag_ids
 * when that endpoint is not deployed yet.
 */
export async function setStudioProductTagged(
  productId: number,
  options: { tagName: string; tagSlug: string; enabled: boolean; tagId?: number }
): Promise<StudioProduct> {
  const ensured = options.tagId
    ? { id: options.tagId, name: options.tagName, slug: options.tagSlug }
    : await ensureStudioTag(options.tagName, options.tagSlug);
  if (!ensured.id) {
    throw new StudioApiError('Tag is missing an id', 400, ensured);
  }

  if (!options.enabled) {
    try {
      const saved = await studioFetchJson<StudioProduct>(
        `/products/${productId}/remove_tags/`,
        {
          method: 'POST',
          body: JSON.stringify({
            names: [options.tagName],
            slugs: [options.tagSlug],
          }),
        }
      );
      if (saved.tags == null) {
        return retrieveStudioProduct(productId);
      }
      return saved;
    } catch (err) {
      // Older API builds may not have remove_tags yet — fall back to tag_ids rewrite.
      if (!(err instanceof StudioApiError) || ![403, 404, 405].includes(err.status)) {
        throw err;
      }
    }

    const product = await retrieveStudioProduct(productId);
    const currentTags = product.tags || [];
    const matchesTarget = (tag: { id?: number; name?: string; slug?: string }) => {
      if (tag.id != null && tag.id === ensured.id) return true;
      const name = tag.name?.toLowerCase() || '';
      const slug = tag.slug?.toLowerCase() || '';
      return (
        name === options.tagName.toLowerCase() ||
        slug === options.tagSlug.toLowerCase() ||
        slug === options.tagName.toLowerCase()
      );
    };
    const nextIds = currentTags
      .filter((t) => !matchesTarget(t))
      .map((t) => t.id)
      .filter((id): id is number => typeof id === 'number');
    const saved = await setStudioProductTagIds(productId, nextIds);
    if (saved.tags == null) {
      return retrieveStudioProduct(productId);
    }
    return saved;
  }

  const product = await retrieveStudioProduct(productId);
  const currentTags = product.tags || [];
  const kept = currentTags
    .map((t) => t.id)
    .filter((id): id is number => typeof id === 'number');
  const nextIds = Array.from(new Set([...kept, ensured.id]));
  const saved = await setStudioProductTagIds(productId, nextIds);
  if (saved.tags == null) {
    return retrieveStudioProduct(productId);
  }
  return saved;
}

export async function setStudioProductFeatured(
  productId: number,
  featured: boolean,
  featuredTagId?: number
): Promise<StudioProduct> {
  return setStudioProductTagged(productId, {
    tagName: 'Featured',
    tagSlug: 'featured',
    enabled: featured,
    tagId: featuredTagId,
  });
}

