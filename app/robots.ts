import { site } from "@/lib/data/site";

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/v1/admin"] },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
