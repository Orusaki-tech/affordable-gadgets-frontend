# SEO Fields Management Guide

This guide shows you exactly where to find and edit all the enhanced SEO fields.

## 📍 Where SEO Fields Are Located

### Currently, SEO fields are in **TWO places**:

1. **Frontend Code Files** (for structured data)
2. **Environment Variables** (for basic config)
3. **Admin Panel** (for product-level SEO)

---

## 🗂️ File Locations

### 1. Brand Configuration File
**Location:** `affordable-gadgets-frontend/lib/config/brand.ts`

**What's Here:**
- Basic business information
- Address, phone, email
- Opening hours
- Social media links
- Site URL

**How to Edit:**
- Open the file in your code editor
- Modify the values
- Redeploy your frontend

---

### 2. Structured Data Component
**Location:** `affordable-gadgets-frontend/components/StructuredData.tsx`

**What's Here:**
- Enhanced LocalBusiness schema fields
- WebSite schema
- Service schema
- All the advanced SEO features

**How to Edit:**
- Open the file in your code editor
- Find the specific field you want to change
- Modify the value
- Redeploy your frontend

---

## 📋 Field-by-Field Breakdown

### ✅ Fields You CAN Edit in Admin Panel

| Field | Location | How to Edit |
|-------|----------|-------------|
| **Product Videos** | Admin → Products → Edit Product → Video Section | Upload video URL or file |
| **Product Meta Title** | Admin → Products → Edit Product → SEO Section | Fill in meta title field |
| **Product Meta Description** | Admin → Products → Edit Product → SEO Section | Fill in meta description field |
| **Product Keywords** | Admin → Products → Edit Product → SEO Section | Fill in keywords field |
| **Product Slug** | Admin → Products → Edit Product → SEO Section | Fill in slug field |

---

### ⚙️ Fields Currently in Code (Need Code Edit)

#### **File: `lib/config/brand.ts`**

| Field | Current Value | Line | How to Change |
|-------|--------------|------|---------------|
| `business.name` | 'Affordable Gadgets' | 38 | Edit line 38 |
| `business.description` | 'Shop top smartphones...' | 39 | Edit line 39 |
| `business.address.streetAddress` | 'Kimathi House Room 409' | 41 | Edit line 41 |
| `business.address.addressLocality` | 'Nairobi' | 42 | Edit line 42 |
| `business.phone` | '+254717881573' | 47 | Edit line 47 |
| `business.email` | 'affordablegadgetske@gmail.com' | 48 | Edit line 48 |
| `business.priceRange` | '$$' | 49 | Edit line 49 |
| `business.openingHours` | ['Mo-Fr 09:00-18:00', 'Sa 09:00-17:00'] | 50-53 | Edit lines 50-53 |
| `business.sameAs` | Social media URLs | 55-60 | Edit lines 55-60 |

#### **File: `components/StructuredData.tsx`**

| Field | Current Value | Line | How to Change |
|-------|--------------|------|---------------|
| `alternateName` | 'Phone Place Kenya' | 33 | Edit line 33 |
| `paymentAccepted` | 'Cash, Credit Card...' | 111 | Edit line 111 |
| `currenciesAccepted` | 'KES' | 112 | Edit line 112 |
| `slogan` | 'Top smartphones...' | 115 | Edit line 115 |
| `areaServed` | 'Kenya' | 79-82 | Edit lines 79-82 |
| `geo.latitude` | -1.2921 | 54 | Edit line 54 |
| `geo.longitude` | 36.8219 | 55 | Edit line 55 |
| `aggregateRating.ratingValue` | '4.6' | 73 | Edit line 73 |
| `aggregateRating.reviewCount` | '2251' | 74 | Edit line 74 |
| Service `description` | 'Fast delivery service...' | 177 | Edit line 177 |
| Service `areaServed` | ['Nairobi', 'Kenya'] | 167-176 | Edit lines 167-176 |

---

## 🔍 How to Inspect Your SEO Data

### Method 1: View Page Source

1. **Open your website** in a browser
2. **Right-click** → **View Page Source** (or `Ctrl+U` / `Cmd+U`)
3. **Search for** `"@type": "LocalBusiness"` or `application/ld+json`
4. **Find the JSON-LD scripts** - these contain all your structured data

### Method 2: Browser DevTools

1. **Open your website** in a browser
2. **Press F12** to open DevTools
3. **Go to Elements/Inspector tab**
4. **Search for** `<script type="application/ld+json">`
5. **Click to expand** and view the JSON

### Method 3: Google Rich Results Test

1. **Visit:** https://search.google.com/test/rich-results
2. **Enter your homepage URL**
3. **Click "Test URL"**
4. **View all detected structured data**

### Method 4: Schema.org Validator

1. **Visit:** https://validator.schema.org/
2. **Enter your homepage URL**
3. **Click "Run Test"**
4. **View all schemas** with validation

---

## ✏️ Step-by-Step: How to Edit Each Field

### Example 1: Change Alternate Name

**Current:** `alternateName: 'Phone Place Kenya'`

**Steps:**
1. Open `affordable-gadgets-frontend/components/StructuredData.tsx`
2. Find line 33: `alternateName: 'Phone Place Kenya',`
3. Change to: `alternateName: 'Your Alternative Name',`
4. Save the file
5. Redeploy your frontend

---

### Example 2: Change Payment Methods

**Current:** `paymentAccepted: 'Cash, Credit Card, Mobile Money, M-Pesa'`

**Steps:**
1. Open `affordable-gadgets-frontend/components/StructuredData.tsx`
2. Find line 111: `paymentAccepted: 'Cash, Credit Card, Mobile Money, M-Pesa',`
3. Change to: `paymentAccepted: 'Cash, M-Pesa, Airtel Money, Credit Card',`
4. Save the file
5. Redeploy your frontend

---

### Example 3: Change Business Address

**Current:** `streetAddress: 'Kimathi House Room 409'`

**Steps:**
1. Open `affordable-gadgets-frontend/lib/config/brand.ts`
2. Find line 41: `streetAddress: 'Kimathi House Room 409',`
3. Change to: `streetAddress: 'Your New Address',`
4. Save the file
5. Redeploy your frontend

---

### Example 4: Change Rating/Review Count

**Current:** 
- `ratingValue: '4.6'`
- `reviewCount: '2251'`

**Steps:**
1. Open `affordable-gadgets-frontend/components/StructuredData.tsx`
2. Find lines 73-74:
   ```typescript
   ratingValue: '4.6',
   reviewCount: '2251',
   ```
3. Update to your actual values:
   ```typescript
   ratingValue: '4.8',  // Your actual rating
   reviewCount: '1500', // Your actual review count
   ```
4. Save the file
5. Redeploy your frontend

**Note:** These should match your actual Google Business Profile ratings!

---

### Example 5: Change Delivery Service Description

**Current:** `description: 'Fast delivery service: 1-2 hours in Nairobi, 24 hours across Kenya'`

**Steps:**
1. Open `affordable-gadgets-frontend/components/StructuredData.tsx`
2. Find line 177: `description: 'Fast delivery service: 1-2 hours in Nairobi, 24 hours across Kenya',`
3. Change to your actual delivery times:
   ```typescript
   description: 'Same-day delivery in Nairobi, next-day delivery across Kenya',
   ```
4. Save the file
5. Redeploy your frontend

---

## 🎯 Quick Reference: All Editable Fields

### In `lib/config/brand.ts`:

```typescript
business: {
  name: 'Affordable Gadgets',              // Line 38
  description: 'Shop top smartphones...',  // Line 39
  address: {
    streetAddress: 'Kimathi House...',     // Line 41
    addressLocality: 'Nairobi',            // Line 42
    addressRegion: 'Nairobi',              // Line 43
    postalCode: '00100',                   // Line 44
    addressCountry: 'KE',                  // Line 45
  },
  phone: '+254717881573',                  // Line 47
  email: 'affordablegadgetske@gmail.com', // Line 48
  priceRange: '$$',                        // Line 49
  openingHours: [...],                     // Lines 50-53
  sameAs: [...],                           // Lines 55-60
}
```

### In `components/StructuredData.tsx`:

```typescript
// LocalBusiness Schema (lines 29-116)
alternateName: 'Phone Place Kenya',        // Line 33
paymentAccepted: 'Cash, Credit Card...',   // Line 111
currenciesAccepted: 'KES',                  // Line 112
slogan: 'Top smartphones...',              // Line 115
areaServed: { name: 'Kenya' },             // Lines 79-82
geo: {
  latitude: -1.2921,                       // Line 54
  longitude: 36.8219,                      // Line 55
},
aggregateRating: {
  ratingValue: '4.6',                      // Line 73
  reviewCount: '2251',                     // Line 74
},

// Service Schema (lines 158-197)
description: 'Fast delivery service...',    // Line 177
areaServed: ['Nairobi', 'Kenya'],          // Lines 167-176
```

---

## 🔄 Making Fields Admin-Editable (Future Enhancement)

Currently, these fields are in code. To make them admin-editable, you would need to:

1. **Add fields to Brand model** in backend
2. **Create admin interface** for editing
3. **Update API** to serve brand config
4. **Update frontend** to fetch from API

**This is a larger change** - let me know if you want me to implement this!

---

## 📝 Checklist: Fields to Update

When setting up your SEO, make sure to update:

### ✅ Basic Business Info (in `brand.ts`):
- [ ] Business name
- [ ] Business description
- [ ] Address (street, city, region, postal code)
- [ ] Phone number
- [ ] Email address
- [ ] Opening hours
- [ ] Social media URLs

### ✅ Enhanced SEO Fields (in `StructuredData.tsx`):
- [ ] Alternate name (for brand variations)
- [ ] Payment methods accepted
- [ ] Currencies accepted
- [ ] Business slogan
- [ ] Service area
- [ ] Geo coordinates (latitude/longitude)
- [ ] Rating and review count (match Google Business Profile)
- [ ] Delivery service description

### ✅ Product-Level SEO (in Admin Panel):
- [ ] Meta titles for all products
- [ ] Meta descriptions for all products
- [ ] Keywords for all products
- [ ] Slugs for all products
- [ ] Product videos (where applicable)

---

## 🧪 Testing Your Changes

After editing, always test:

1. **View Page Source** - Check JSON-LD is correct
2. **Google Rich Results Test** - Validate structured data
3. **Schema.org Validator** - Check for errors
4. **Browser DevTools** - Inspect JSON-LD scripts

---

## 📞 Need Help?

If you need to:
- **Change multiple fields** - Edit the files directly
- **Make fields admin-editable** - This requires backend changes (I can help!)
- **Validate your changes** - Use the testing tools above
- **Understand a specific field** - Check the comments in the code

---

**Last Updated:** 2024
**Files to Edit:** 
- `lib/config/brand.ts`
- `components/StructuredData.tsx`
- Admin Panel (for products)
