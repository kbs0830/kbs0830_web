import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/go/", "/radar/live"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
