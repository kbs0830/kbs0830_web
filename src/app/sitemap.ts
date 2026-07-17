import { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";

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
    {
      url: "https://kbs0830.com/blog",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...projects.map((p) => ({
      url: `https://kbs0830.com/projects/${p.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getAllPosts().map((post) => ({
      url: `https://kbs0830.com/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
