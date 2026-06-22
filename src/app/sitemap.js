const BASE = "https://tryneutraleye.com";

export default function sitemap() {
  return [
    { url: BASE, lastModified: new Date(), priority: 1 },
    { url: `${BASE}/analyze`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE}/how-it-works`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/extension`, lastModified: new Date(), priority: 0.8 },
    { url: `${BASE}/methodology`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/faq`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/changelog`, lastModified: new Date(), priority: 0.6 },
    { url: `${BASE}/support`, lastModified: new Date(), priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: new Date(), priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/extension-privacy`, lastModified: new Date(), priority: 0.4 },
  ];
}
