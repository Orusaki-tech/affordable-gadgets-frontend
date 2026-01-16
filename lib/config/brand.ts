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







