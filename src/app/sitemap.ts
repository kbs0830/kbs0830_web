import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: "https://kbs0830.com",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://kbs0830.com/now",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://kbs0830.com/uses",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
