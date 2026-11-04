import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://purelyjid.in";

  return [
    {
      url: baseUrl,
      priority: 1,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/track-order`,
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/our-story`,
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/resin-art-consultation`,
      priority: 0.9,
      changeFrequency: "monthly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/shipping`,
      priority: 0.4,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/privacy`,
      priority: 0.4,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },

    {
      url: `${baseUrl}/terms`,
      priority: 0.4,
      changeFrequency: "yearly",
      lastModified: new Date(),
    },
  ];
}
