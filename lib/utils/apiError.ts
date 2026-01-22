export type ApiErrorInfo = {
  data: unknown;
  message: string;
  brandCode?: string;
  status?: number;
  url?: string;
};

export const getApiErrorInfo = (err: any): ApiErrorInfo => {
  const data = err?.response?.data ?? err?.body ?? {};
  const status = err?.response?.status ?? err?.status;
  const url = err?.config?.url ?? err?.url;
  const message =
    typeof data === 'string'
      ? data
      : data?.error || data?.detail || err?.message || 'Unknown error';
  const brandCode =
    typeof data === 'object' && data !== null ? (data as any).brand_code : undefined;

  return { data, message, brandCode, status, url };
};
