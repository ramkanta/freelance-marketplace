import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const STATIC_ROUTES = ['', '/services', '/login', '/signup', '/privacy', '/terms', '/cookies'];

interface ServiceListItem {
  id: string;
  created_at?: string;
}
interface FreelancerListItem {
  user_id: string;
}

async function fetchServiceIds(): Promise<ServiceListItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/services?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}

async function fetchFreelancerIds(): Promise<FreelancerListItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/freelancers`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body) ? body : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, freelancers] = await Promise.all([fetchServiceIds(), fetchFreelancerIds()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.id}`,
    lastModified: s.created_at ? new Date(s.created_at) : new Date(),
  }));

  const freelancerEntries: MetadataRoute.Sitemap = freelancers.map((f) => ({
    url: `${SITE_URL}/freelancers/${f.user_id}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...serviceEntries, ...freelancerEntries];
}
