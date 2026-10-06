export type ApiErrorInfo = {
  data: unknown;
  message: string;
  brandCode?: string;
  status?: number;
  url?: string;
};

function formatFieldErrors(details: Record<string, unknown>): string | null {
  const parts = Object.entries(details).map(([key, value]) => {
    const text = Array.isArray(value)
      ? value.map(String).join(', ')
      : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value);
    return `${key}: ${text}`;
  });
  return parts.length ? parts.join('; ') : null;
}

/** Prefer API body fields over the generic OpenAPI "Bad Request" statusText. */
export const formatApiErrorMessage = (err: any, fallback = 'Something went wrong'): string => {
  const data = err?.response?.data ?? err?.body ?? null;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === 'string' && record.detail.trim()) {
      return record.detail.trim();
    }
    if (record.details && typeof record.details === 'object' && record.details !== null) {
      const nested = formatFieldErrors(record.details as Record<string, unknown>);
      if (nested) return nested;
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      // "Validation failed" alone is useless — prefer nested details when present.
      if (record.error !== 'Validation failed' || !record.details) {
        return record.error.trim();
      }
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }
  }

  const raw = typeof err?.message === 'string' ? err.message.trim() : '';
  if (raw && raw !== 'Bad Request' && raw !== 'Error') {
    return raw;
  }

  return fallback;
};

export const getApiErrorInfo = (err: any): ApiErrorInfo => {
  const data = err?.response?.data ?? err?.body ?? {};
  const status = err?.response?.status ?? err?.status;
  const url = err?.config?.url ?? err?.url;
  const message = formatApiErrorMessage(err, 'Unknown error');
  const brandCode =
    typeof data === 'object' && data !== null ? (data as any).brand_code : undefined;

  return { data, message, brandCode, status, url };
};
