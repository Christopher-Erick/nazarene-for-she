import type { Metadata } from "next";
import { site } from "@/lib/data/site";

export const defaultTitle = {
  default: `${site.name} — ${site.tagline}`,
  template: `%s — ${site.name}`,
};

/** The site-wide share card (app/opengraph-image.tsx). */
const DEFAULT_SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` };

export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  /** A page photo to use when the page is shared (WhatsApp, Facebook, X). Defaults to the site card. */
  image?: string;
  /** Private or unfinished pages: keep them out of search results. */
  noindex?: boolean;
}): Metadata {
  const url = `${site.url}${path}`;
  // Page openGraph replaces the layout's, so the share image must be set here or it disappears.
  const images = image ? [{ url: image, alt: title }] : [DEFAULT_SHARE_IMAGE];
  return {
    title,
    description,
    alternates: noindex ? {} : { canonical: url },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url,
      type: "website",
      siteName: site.name,
      locale: site.locale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: images.map((item) => item.url),
    },
  };
}
