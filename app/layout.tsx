import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { HashScroll } from "@/components/ui/HashScroll";
import { SkipLink } from "@/components/ui/SkipLink";
import { site } from "@/lib/data/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  category: "Nonprofit",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.tenSecondStory,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.tenSecondStory,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/images/logo-mark.png",
    apple: "/images/logo-mark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5e2063",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-KE"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text font-sans">
        <JsonLd />
        <SkipLink />
        <HashScroll />
        <SiteHeader />
        <main id="main" className="flex-1 pt-[var(--header-height)]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
