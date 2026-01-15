# CDN Configuration Guide

## Current CDN Status

### ✅ Already Configured
- **Backend Media (Product Images/Videos)**: Cloudinary CDN
  - Location: `store/settings.py` lines 166-179
  - All uploaded media automatically served via Cloudinary's global CDN
  - URLs like: `https://res.cloudinary.com/your-cloud/image/upload/...`

- **Next.js Image Optimization**: Configured for Cloudinary
  - Location: `next.config.ts` lines 22-75
  - Remote images from Cloudinary are optimized and cached

### ❌ Not Configured
- **Frontend Static Assets** (`/public/` folder):
  - Logo, icons, and other static files served directly by Next.js
  - No explicit CDN configuration

---

## Option 1: Vercel Edge Network (Recommended if using Vercel)

If you deploy to Vercel, static assets are automatically served via their global edge network.

**Setup:**
1. Deploy to Vercel (automatic if connected to GitHub)
2. No configuration needed - automatic CDN for all static assets
3. Your logo at `/public/affordablegadgetslogo.png` will be served from edge locations

**Benefits:**
- Zero configuration
- Automatic global distribution
- Free tier includes generous bandwidth
- Automatic HTTPS

---

## Option 2: Cloudflare CDN (Recommended for Custom Domains)

Best for custom domains with high traffic.

**Setup Steps:**

1. **Sign up for Cloudflare** (free tier available)
2. **Add your domain** to Cloudflare
3. **Update DNS** to use Cloudflare nameservers
4. **Configure in Next.js:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config ...
  
  // Add asset prefix for Cloudflare CDN
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.yourdomain.com' 
    : '',
  
  // ... rest of config
};
```

5. **Set up Cloudflare Workers** (optional, for advanced caching)

**Benefits:**
- Free tier available
- Excellent performance
- DDoS protection included
- Easy SSL certificates

---

## Option 3: AWS CloudFront (Enterprise Option)

Best for AWS infrastructure or enterprise needs.

**Setup Steps:**

1. **Create S3 bucket** for static assets
2. **Upload assets** to S3
3. **Create CloudFront distribution** pointing to S3
4. **Update Next.js config:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config ...
  
  assetPrefix: process.env.CDN_URL || '',
  
  // ... rest of config
};
```

5. **Set environment variable:**
```bash
CDN_URL=https://d1234567890.cloudfront.net
```

**Benefits:**
- Enterprise-grade reliability
- Pay-as-you-go pricing
- Advanced caching rules
- Integration with AWS services

---

## Option 4: Next.js with Custom CDN (Manual Setup)

For maximum control with any CDN provider.

**Example with any CDN:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config ...
  
  // Use environment variable for CDN URL
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || '',
  
  // ... rest of config
};
```

**Environment variable:**
```bash
# .env.local or .env.production
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
```

**Then update image references:**
```typescript
// Instead of:
<Image src="/affordablegadgetslogo.png" />

// Use:
<Image src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/affordablegadgetslogo.png`} />
```

---

## Option 5: Cloudinary for Static Assets (Unified Solution)

Use Cloudinary for both backend media AND frontend static assets.

**Setup Steps:**

1. **Upload static assets to Cloudinary:**
   - Upload logo, icons, etc. to Cloudinary dashboard
   - Get public URLs

2. **Update components to use Cloudinary URLs:**
```typescript
// Instead of local path
<Image src="/affordablegadgetslogo.png" />

// Use Cloudinary URL
<Image 
  src="https://res.cloudinary.com/your-cloud/image/upload/v123/affordablegadgetslogo.png" 
/>
```

3. **Or create a helper function:**
```typescript
// lib/utils/cdn.ts
export const getCDNUrl = (path: string) => {
  if (process.env.NEXT_PUBLIC_CDN_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_CDN_BASE_URL}${path}`;
  }
  return path; // Fallback to local
};

// Usage:
<Image src={getCDNUrl('/affordablegadgetslogo.png')} />
```

**Benefits:**
- Unified CDN for all assets
- Image transformations on-the-fly
- Already have Cloudinary account
- Automatic optimization

---

## Recommendation

### For Most Cases:
**Use Vercel** (if deploying there) - Zero configuration, automatic CDN

### For Custom Domain + High Traffic:
**Use Cloudflare** - Free tier, excellent performance, easy setup

### For Enterprise:
**Use AWS CloudFront** - Maximum control, enterprise features

### For Simplicity:
**Keep current setup** - Next.js/Vercel already provides good caching. Only add explicit CDN if you have:
- Global audience
- High traffic (>100k visitors/month)
- Performance requirements
- Custom domain with specific needs

---

## Quick Setup: Cloudflare (Most Common)

1. Sign up: https://cloudflare.com
2. Add your domain
3. Update DNS nameservers
4. Enable "Proxy" (orange cloud) for your domain
5. Done! All assets now served via Cloudflare CDN

No code changes needed if you just want basic CDN for your domain.

---

## Testing CDN Performance

After setup, test with:
- **GTmetrix**: https://gtmetrix.com
- **PageSpeed Insights**: https://pagespeed.web.dev
- **WebPageTest**: https://webpagetest.org

Look for:
- Reduced load times
- Lower TTFB (Time to First Byte)
- Geographic distribution working

---

## Current Setup Assessment

**Your current setup is GOOD for:**
- ✅ Small to medium traffic
- ✅ Regional audience
- ✅ Development and staging
- ✅ Backend media (already on CDN)

**Consider adding CDN if:**
- ❌ Global audience
- ❌ High traffic (>100k/month)
- ❌ Performance issues
- ❌ Custom domain with specific requirements
