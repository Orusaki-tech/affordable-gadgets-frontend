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
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value[0]) return String(value[0]);
      if (typeof value === 'string') return value;
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
  }>;
  og_image_url?: string | null;
  primary_image?: string | null;
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
}): Promise<StudioPaginatedProducts> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.search?.trim()) query.set('search', params.search.trim());
  const qs = query.toString();
  return studioFetchJson<StudioPaginatedProducts>(`/products/${qs ? `?${qs}` : ''}`);
}

export async function retrieveStudioProduct(id: number): Promise<StudioProduct> {
  return studioFetchJson<StudioProduct>(`/products/${id}/`);
}

export async function createStudioProduct(
  data: Record<string, string | Blob | boolean | number | null | undefined>
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') {
      form.append(key, value ? 'true' : 'false');
    } else {
      form.append(key, value as string | Blob);
    }
  });
  return studioFetchJson<StudioProduct>('/products/', {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export async function patchStudioProduct(
  id: number,
  data: Record<string, string | Blob | boolean | number | null | undefined>
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      form.append(key, '');
      return;
    }
    if (typeof value === 'boolean') {
      form.append(key, value ? 'true' : 'false');
    } else {
      form.append(key, value as string | Blob);
    }
  });
  return studioFetchJson<StudioProduct>(`/products/${id}/`, {
    method: 'PATCH',
    body: form,
    multipart: true,
  });
}

export async function updateStudioProductContent(
  id: number,
  data: Record<string, string | Blob | boolean | number | null | undefined>
): Promise<StudioProduct> {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      form.append(key, '');
      return;
    }
    if (typeof value === 'boolean') {
      form.append(key, value ? 'true' : 'false');
    } else {
      form.append(key, value as string | Blob);
    }
  });
  return studioFetchJson<StudioProduct>(`/products/${id}/update_content/`, {
    method: 'PATCH',
    body: form,
    multipart: true,
  });
}

export async function deleteStudioProduct(id: number): Promise<void> {
  const res = await studioFetch(`/products/${id}/`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const body = await parseBody(res);
    throw new StudioApiError(
      messageFromBody(body, `Delete failed (${res.status})`),
      res.status,
      body
    );
  }
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
  thumbnail_image?: string | null;
};

export type StudioPaginatedArticles = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudioArticle[];
};

export async function retrieveStudioArticle(id: number): Promise<StudioArticle> {
  return studioFetchJson<StudioArticle>(`/articles/${id}/`);
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
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioArticle> {
  return studioFetchJson<StudioArticle>(`/articles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
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
};

export async function retrieveStudioPromotion(id: number): Promise<StudioPromotion> {
  return studioFetchJson<StudioPromotion>(`/promotions/${id}/`);
}

export async function patchStudioPromotion(
  id: number,
  data: Record<string, string | boolean | number | null | undefined>
): Promise<StudioPromotion> {
  return studioFetchJson<StudioPromotion>(`/promotions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
