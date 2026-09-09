import { OpenAPI } from '@/lib/api/generated';
import { inventoryBaseUrl } from '@/lib/api/openapi';

type InventoryJsonInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/**
 * Call an /api/inventory/... endpoint without mutating OpenAPI.BASE.
 * Swapping the global base races with public product requests and causes
 * "Error loading products" / ApiError Not Found on the storefront.
 */
export async function fetchInventoryJson<T>(
  path: string,
  init: InventoryJsonInit = {}
): Promise<T> {
  const headersFromOpenApi =
    typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {});

  const { body, headers: initHeaders, ...rest } = init;
  const url = `${inventoryBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '1',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headersFromOpenApi as Record<string, string>),
      ...(initHeaders as Record<string, string> | undefined),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => null);
    }
    const error = new Error(
      typeof detail === 'object' && detail && 'detail' in detail
        ? String((detail as { detail: unknown }).detail)
        : `Inventory request failed: ${response.status}`
    ) as Error & { status?: number; body?: unknown };
    error.status = response.status;
    error.body = detail;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
