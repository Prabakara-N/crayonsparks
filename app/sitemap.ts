import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "@/lib/prompts";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.crayonsparks.com"
).replace(/\/+$/, "");

function readBlogSlugs(): string[] {
  try {
    const dir = path.join(process.cwd(), "content", "blog");
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const freePages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${siteUrl}/free/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogPosts: MetadataRoute.Sitemap = readBlogSlugs().map((slug) => ({
    url: `${siteUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...core, ...freePages, ...blogPosts];
}
