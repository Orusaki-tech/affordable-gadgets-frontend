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

// Helper function to normalize site URL (must have protocol for Next.js metadata)
const normalizeSiteUrl = (url: string | undefined): string => {
  const defaultUrl = 'https://www.affordablegadgets.co.ke';
  
  if (!url || url.trim() === '') {
    return defaultUrl;
  }
  
  let normalized = url.trim();
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // Fix protocol-relative URLs (starting with //)
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  
  // If URL doesn't start with http:// or https://, add https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
};

export const brandConfig = {
  code: process.env.NEXT_PUBLIC_BRAND_CODE || 'AFFORDABLE_GADGETS',
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Affordable Gadgets Ke',
  apiBaseUrl: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL),
  // Business information for LocalBusiness schema
  business: {
    name: 'Affordable Gadgets Ke',
    description: 'Your go to destination for affordable tech devices, PCs & accessories. Quality Gadgets at unbeatable prices!',
    address: {
      streetAddress: 'Kimathi House Room 409',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi',
      postalCode: '00100',
      addressCountry: 'KE',
    },
    phone: '+254717881573',
    email: 'affordablegadgetske@gmail.com',
    priceRange: '$',
    openingHours: [
      'Mo-Fr 09:00-18:00',
      'Sa 09:00-17:00',
    ],
    // Social media profiles
    sameAs: [
      'https://www.facebook.com/share/183qZXAKhB/?mibextid=wwXIfr',
      'https://x.com/afford_gadgets',
      'https://www.tiktok.com/@affordablegadgetske',
      'https://www.instagram.com/affordablegadgetske',
    ],
  },
} as const;







