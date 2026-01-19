import { brandConfig } from '@/lib/config/brand';

interface StructuredDataProps {
  type?: 'Organization' | 'LocalBusiness' | 'BreadcrumbList' | 'WebSite' | 'Service';
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function StructuredData({ type = 'Organization', breadcrumbs }: StructuredDataProps) {
  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandConfig.business.name,
    url: brandConfig.siteUrl,
    logo: `${brandConfig.siteUrl}/affordablelogo.png`,
    description: brandConfig.business.description,
    email: brandConfig.business.email,
    telephone: brandConfig.business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: brandConfig.business.address.streetAddress,
      addressLocality: brandConfig.business.address.addressLocality,
      addressRegion: brandConfig.business.address.addressRegion,
      postalCode: brandConfig.business.address.postalCode,
      addressCountry: brandConfig.business.address.addressCountry,
    },
    sameAs: brandConfig.business.sameAs,
  });

  const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: brandConfig.business.name,
    image: [
      `${brandConfig.siteUrl}/affordablelogo.png`,
      // Add more image URLs if you have store photos
    ],
    '@id': `${brandConfig.siteUrl}#store`,
    url: brandConfig.siteUrl,
    telephone: brandConfig.business.phone,
    email: brandConfig.business.email,
    priceRange: brandConfig.business.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: brandConfig.business.address.streetAddress,
      addressLocality: brandConfig.business.address.addressLocality,
      addressRegion: brandConfig.business.address.addressRegion,
      postalCode: brandConfig.business.address.postalCode,
      addressCountry: brandConfig.business.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      // Approximate coordinates for Kimathi House, Nairobi
      latitude: -1.2921,
      longitude: 36.8219,
    },
    openingHoursSpecification: brandConfig.business.openingHours.map((hours) => {
      const [days, time] = hours.split(' ');
      const [open, close] = time.split('-');
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days === 'Mo-Fr' 
          ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          : ['Saturday'],
        opens: open,
        closes: close,
      };
    }),
    sameAs: brandConfig.business.sameAs,
    // Additional properties for better Google Business integration
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.6',
      reviewCount: '2251',
      bestRating: '5',
      worstRating: '1',
    },
    // Enhanced fields to beat competitors
    areaServed: {
      '@type': 'Country',
      name: 'Kenya',
    },
    servesCuisine: undefined, // Not applicable for electronics store
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Electronics Catalog',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Smartphones',
          url: `${brandConfig.siteUrl}/products?type=PH`,
        },
        {
          '@type': 'OfferCatalog',
          name: 'Laptops',
          url: `${brandConfig.siteUrl}/products?type=LT`,
        },
        {
          '@type': 'OfferCatalog',
          name: 'Tablets',
          url: `${brandConfig.siteUrl}/products?type=TB`,
        },
        {
          '@type': 'OfferCatalog',
          name: 'Accessories',
          url: `${brandConfig.siteUrl}/products?type=AC`,
        },
      ],
    },
    // Payment methods accepted
    paymentAccepted: 'Cash, Credit Card, Mobile Money, M-Pesa',
    currenciesAccepted: 'KES',
    // Additional business info
    description: brandConfig.business.description,
    slogan: 'Top smartphones and accessories at unbeatable prices',
  });

  const getBreadcrumbSchema = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  };

  const getWebSiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brandConfig.business.name,
    url: brandConfig.siteUrl,
    description: brandConfig.business.description,
    publisher: {
      '@type': 'Organization',
      name: brandConfig.business.name,
      logo: {
        '@type': 'ImageObject',
        url: `${brandConfig.siteUrl}/affordablelogo.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${brandConfig.siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-KE',
  });

  const getServiceSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Delivery Service',
    provider: {
      '@type': 'LocalBusiness',
      name: brandConfig.business.name,
      url: brandConfig.siteUrl,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Nairobi',
      },
      {
        '@type': 'Country',
        name: 'Kenya',
      },
    ],
    description: 'Fast delivery service: 1-2 hours in Nairobi, 24 hours across Kenya',
    offers: {
      '@type': 'Offer',
      description: 'Fast delivery service',
      price: '0',
      priceCurrency: 'KES',
    },
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '18:00',
    },
  });

  const getSchema = () => {
    switch (type) {
      case 'LocalBusiness':
        return getLocalBusinessSchema();
      case 'BreadcrumbList':
        return getBreadcrumbSchema();
      case 'WebSite':
        return getWebSiteSchema();
      case 'Service':
        return getServiceSchema();
      default:
        return getOrganizationSchema();
    }
  };

  const schema = getSchema();
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
