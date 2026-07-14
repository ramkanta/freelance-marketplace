import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/customer/',
        '/freelancer/dashboard',
        '/freelancer/onboard',
        '/freelancer/profile',
        '/orders/',
        '/support/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
