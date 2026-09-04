import type { ContentType } from "@/lib/cms/content";

export function adminListPath(type: ContentType | string) {
  if (type === "atelier") return "/admin/shop";
  return `/admin/${type}`;
}

export function adminEditPath(type: ContentType | string, id: string) {
  if (type === "atelier") return `/admin/shop/category/${id}`;
  return `/admin/${type}/${id}`;
}

export function publicPathFor(type: ContentType | string, slug: string) {
  switch (type) {
    case "atelier":
      return `/shop/${slug}`;
    case "pages":
      return slug === "about" ? "/about" : `/${slug}`;
    case "programs":
      return `/programs/${slug}`;
    case "stories":
      return `/stories/${slug}`;
    case "events":
      return `/events/${slug}`;
    default:
      return "/";
  }
}
