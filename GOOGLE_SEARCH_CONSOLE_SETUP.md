# Google Search Console Setup Guide

This guide will help you set up Google Search Console for your Affordable Gadgets website to improve your search visibility and track performance.

## Prerequisites

- Your website must be live and accessible
- You must have access to your domain's DNS settings or website files
- A Google account

## Step 1: Access Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click **"Add Property"** or **"Start now"**

## Step 2: Verify Website Ownership

You need to prove you own the website. Choose one of these methods:

### Method 1: HTML File Upload (Recommended)

1. In Search Console, select **"HTML file upload"**
2. Download the HTML verification file (e.g., `google1234567890.html`)
3. Upload it to your website's root directory (`/public/` folder)
4. Make sure it's accessible at: `https://yourdomain.com/google1234567890.html`
5. Click **"Verify"** in Search Console

### Method 2: HTML Tag

1. In Search Console, select **"HTML tag"**
2. Copy the meta tag provided (looks like: `<meta name="google-site-verification" content="..." />`)
3. Add it to your `app/layout.tsx` file in the `<head>` section:

```tsx
// In app/layout.tsx, add to the head section
<head>
  <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
</head>
```

4. Deploy your changes
5. Click **"Verify"** in Search Console

### Method 3: DNS Record (For Domain-level verification)

1. In Search Console, select **"Domain"** property type
2. Copy the TXT record provided
3. Add it to your domain's DNS settings
4. Wait for DNS propagation (can take up to 48 hours)
5. Click **"Verify"** in Search Console

### Method 4: Google Analytics (If you have GA4)

1. If you have Google Analytics 4 set up, you can verify automatically
2. Select **"Google Analytics"** method
3. Follow the prompts

## Step 3: Submit Your Sitemap

After verification, submit your sitemap to help Google discover all your pages:

1. In Search Console, go to **"Sitemaps"** in the left sidebar
2. Enter your sitemap URL: `https://yourdomain.com/sitemap.xml`
3. Click **"Submit"**
4. Wait for Google to process (usually within a few hours to a few days)

**Note:** Your sitemap is automatically generated at `/sitemap.xml` and includes:
- Homepage
- Product pages
- Category pages
- Other static pages

## Step 4: Request Indexing for Important Pages

1. Go to **"URL Inspection"** in the left sidebar
2. Enter your homepage URL: `https://yourdomain.com`
3. Click **"Test Live URL"**
4. If the page is not indexed, click **"Request Indexing"**
5. Repeat for key pages:
   - Homepage
   - Main category pages
   - Popular product pages

## Step 5: Set Up Google Business Profile (For Knowledge Panel)

To get the knowledge panel like "Phone Place Kenya" in search results:

1. Go to [Google Business Profile](https://business.google.com)
2. Click **"Manage now"** or **"Get started"**
3. Enter your business name: **"Affordable Gadgets"** or **"Phone Place Kenya"**
4. Select business category: **"Cell phone store"** or **"Electronics store"**
5. Add your business address:
   - **Street:** Kimathi House Room 409
   - **City:** Nairobi
   - **Postal Code:** 00100
   - **Country:** Kenya
6. Add your phone number: **+254 717 881 573**
7. Add your website URL: `https://yourdomain.com`
8. Add business hours:
   - Monday-Friday: 9:00 AM - 6:00 PM
   - Saturday: 9:00 AM - 5:00 PM
9. Upload photos:
   - Store exterior
   - Store interior
   - Product photos
   - Logo
10. Verify your business (Google will send a postcard or call you)
11. Once verified, encourage customers to leave reviews

## Step 6: Monitor Performance

After setup, regularly check:

### Performance Report
1. Go to **"Performance"** in Search Console
2. View:
   - Total clicks
   - Total impressions
   - Average position
   - Click-through rate (CTR)

### Coverage Report
1. Go to **"Coverage"** in Search Console
2. Check for:
   - Indexed pages (should increase over time)
   - Errors (fix any issues found)
   - Excluded pages (review if correct)

### Enhancements
1. Go to **"Enhancements"** in Search Console
2. Check structured data:
   - Products (should show your product pages)
   - Organization (should show your business info)
   - Breadcrumbs (should show navigation)

## Step 7: Fix Issues

### Common Issues and Solutions

#### 1. Structured Data Errors
- **Problem:** Google can't read your structured data
- **Solution:** 
  - Use [Rich Results Test](https://search.google.com/test/rich-results) to test your pages
  - Fix any errors found
  - Ensure JSON-LD is valid

#### 2. Mobile Usability Issues
- **Problem:** Pages not mobile-friendly
- **Solution:** Your Next.js site should be responsive, but verify in Search Console

#### 3. Page Speed Issues
- **Problem:** Pages load too slowly
- **Solution:**
  - Optimize images
  - Use Next.js Image component (already implemented)
  - Enable compression
  - Use CDN for static assets

#### 4. Crawl Errors
- **Problem:** Google can't access some pages
- **Solution:**
  - Check `robots.txt` (already configured)
  - Ensure pages return 200 status codes
  - Fix broken links

## Step 8: Submit Updated Content

When you add new products or update content:

1. Use **"URL Inspection"** to request indexing for new pages
2. Resubmit your sitemap if you've added many new pages
3. Google will automatically discover updates, but manual submission is faster

## Step 9: Monitor Search Appearance

Check how your site appears in search:

1. Go to **"Enhancements"** → **"Structured Data"**
2. Verify:
   - ✅ Products are detected
   - ✅ Organization is detected
   - ✅ Breadcrumbs are detected
   - ✅ Reviews/Ratings are detected (if you have reviews)

## Step 10: Set Up Email Notifications

1. Click the gear icon ⚙️ in Search Console
2. Go to **"Users and permissions"**
3. Add email addresses that should receive alerts
4. Configure notification preferences:
   - Critical issues
   - New issues
   - Performance changes

## Expected Timeline

- **Verification:** Immediate (after DNS/file upload)
- **Initial indexing:** 1-7 days
- **Sitemap processing:** 1-3 days
- **Structured data recognition:** 1-14 days
- **Knowledge panel appearance:** 2-4 weeks (after Google Business Profile verification)
- **Full search visibility:** 2-8 weeks

## Testing Your Setup

### Test Structured Data
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your homepage URL
3. Verify:
   - Organization schema is detected
   - LocalBusiness schema is detected
   - Breadcrumbs are detected

### Test Product Pages
1. Enter a product page URL
2. Verify:
   - Product schema is detected
   - Offer schema is detected
   - AggregateRating is detected (if you have reviews)

### Test Mobile Usability
1. In Search Console, go to **"Mobile Usability"**
2. Check for any mobile issues
3. Fix any problems found

## Best Practices

1. **Keep Content Fresh:** Regularly add new products and update existing ones
2. **Monitor Regularly:** Check Search Console weekly for issues
3. **Fix Issues Promptly:** Address errors as soon as they appear
4. **Request Indexing:** For important new pages, manually request indexing
5. **Encourage Reviews:** More reviews = better ratings in search results
6. **Update Business Info:** Keep Google Business Profile updated with current hours, photos, etc.

## Troubleshooting

### Verification Failed
- Double-check the verification file/tag is accessible
- Ensure DNS records are correct (if using DNS method)
- Wait 24-48 hours for DNS propagation

### Pages Not Indexing
- Check robots.txt isn't blocking pages
- Ensure pages return 200 status codes
- Verify sitemap includes the pages
- Request indexing manually

### Structured Data Not Showing
- Validate JSON-LD syntax
- Ensure schemas are in the page source
- Wait 1-2 weeks for Google to process
- Use Rich Results Test to verify

### Knowledge Panel Not Appearing
- Ensure Google Business Profile is verified
- Add more reviews (aim for 50+)
- Keep business information complete and accurate
- Wait 2-4 weeks after verification

## Additional Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [Structured Data Testing Tool](https://search.google.com/test/rich-results)
- [Google Business Profile Help](https://support.google.com/business)
- [Schema.org Documentation](https://schema.org)

## Support

If you encounter issues:
1. Check Google Search Console Help Center
2. Use the Rich Results Test tool
3. Review your structured data implementation
4. Check server logs for crawl errors

---

**Last Updated:** 2024
**Website:** Your domain here
**Business:** Affordable Gadgets / Phone Place Kenya
