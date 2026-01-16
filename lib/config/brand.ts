/**
 * Brand configuration
 * This can be updated later when design system is provided
 */

// Helper function to normalize API base URL
const normalizeApiBaseUrl = (url: string | undefined): string => {
  if (!url || url.trim() === '') {
    return 'http://localhost:8000';
  }
  
  let normalized = url.trim();
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // Fix protocol-relative URLs (starting with //)
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  
  // If it's a relative URL (starts with / but not http), it's invalid for API calls
  // Return default in this case
  if (normalized.startsWith('/') && !normalized.startsWith('http')) {
    return 'http://localhost:8000';
  }
  
  return normalized;
};

export const brandConfig = {
  code: process.env.NEXT_PUBLIC_BRAND_CODE || 'AFFORDABLE_GADGETS',
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Affordable Gadgets',
  apiBaseUrl: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
} as const;

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7248/ingest/65d9ad06-b70b-4149-bf19-de4e9e0d0599',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brand.ts:35',message:'brandConfig initialized',data:{apiBaseUrl:brandConfig.apiBaseUrl,envVar:process.env.NEXT_PUBLIC_API_BASE_URL,hasTrailingSlash:brandConfig.apiBaseUrl.endsWith('/'),startsWithDoubleSlash:brandConfig.apiBaseUrl.startsWith('//')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
}
// #endregion







