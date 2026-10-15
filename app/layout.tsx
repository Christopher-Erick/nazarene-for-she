import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteShell } from "@/components/layout/SiteShell";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { site } from "@/lib/data/site";
import "./globals.css";

// Fonts live in app/fonts (SIL Open Font License, see OFL-*.txt) so builds never download from
// Google. Each file is the latin variable font covering every weight the site uses.
const outfit = localFont({
  src: "./fonts/outfit-latin.woff2",
  variable: "--font-outfit",
  display: "swap",
  weight: "400 700",
});

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin.woff2", weight: "500 700", style: "normal" },
    { path: "./fonts/fraunces-latin-italic.woff2", weight: "500 700", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1b0b1c" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-KE"
      data-theme="light"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text font-sans">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
