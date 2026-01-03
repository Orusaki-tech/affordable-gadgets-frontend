import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone', // For optimized production builds
  compress: true,
  poweredByHeader: false,
  
  // Allow cross-origin requests from network IPs during development
  allowedDevOrigins: [
    'http://192.168.1.77:3000',
    'http://192.168.1.77:3001',
    'http://192.168.1.77:3002',
    'http://192.168.1.6:3000',
    'http://192.168.1.6:3001',
    'http://192.168.1.6:3002',
    'http://192.168.1.28:3000',
    'http://192.168.1.28:3001',
    'http://192.168.1.28:3002',
  ],
  
  images: {
    // Enable optimization in production, disable in development
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: (() => {
      const devPatterns = process.env.NODE_ENV === 'development' ? [
        {
          protocol: 'http' as const,
          hostname: 'localhost',
          port: '8000',
          pathname: '/**',
        },
        {
          protocol: 'http' as const,
          hostname: '127.0.0.1',
          port: '8000',
          pathname: '/**',
        },
      ] : [];
      
      const prodPatterns = [
        {
          protocol: 'https' as const,
          hostname: 'res.cloudinary.com', // Cloudinary CDN
          pathname: '/**',
        },
        {
          protocol: 'https' as const,
          hostname: '**.railway.app', // Railway backend
          pathname: '/**',
        },
        {
          protocol: 'https' as const,
          hostname: '**.herokuapp.com', // Heroku backend
          pathname: '/**',
        },
        {
          protocol: 'https' as const,
          hostname: '**.onrender.com', // Render backend
          pathname: '/**',
        },
        // Allow custom domains (configure in production)
        {
          protocol: 'https' as const,
          hostname: '**',
          pathname: '/**',
        },
      ];
      
      return [...devPatterns, ...prodPatterns];
    })(),
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BRAND_CODE: process.env.NEXT_PUBLIC_BRAND_CODE,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  },
};

export default nextConfig;
