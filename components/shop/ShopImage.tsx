"use client";

import Image from "next/image";

export function ShopImage({
  src,
  alt,
  sizes,
  priority = false,
  quality = 75,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
}) {
  const local = src.startsWith("/images/");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      unoptimized={local}
    />
  );
}
