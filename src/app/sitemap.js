const BASE = "https://neutraleye-web.vercel.app";

export default function sitemap() {
  return [
    { url: BASE, lastModified: new Date(), priority: 1 },
    { url: `${BASE}/analyze`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/methodology`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/extension-privacy`, lastModified: new Date(), priority: 0.4 },
  ];
}
