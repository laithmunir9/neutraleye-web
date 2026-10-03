const BASE = "https://tryneutraleye.com";

export default function sitemap() {
  return [
    { url: BASE, lastModified: new Date(), priority: 1 },
    { url: `${BASE}/privacy`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE}/extension-privacy`, lastModified: new Date(), priority: 0.4 },
  ];
}
