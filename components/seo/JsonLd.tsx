import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: site.name,
    legalName: site.legalName,
    alternateName: ["Nazarene for SHE", site.abbreviation],
    slogan: site.tagline,
    description: site.description,
    url: site.url,
    email: site.contact.email || undefined,
    foundingDate: String(site.foundingYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Congo, Kawangware",
      addressLocality: "Nairobi",
      addressRegion: "Nairobi County",
      postalCode: "00200",
      postOfficeBoxNumber: "20025",
      addressCountry: "KE",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Kawangware, Nairobi County, Kenya",
    },
    knowsAbout: [
      "Menstrual health Kenya",
      "Period poverty",
      "Girls empowerment",
      "Vocational training",
      "Handmade garments",
      "HIV/AIDS awareness",
      "Mentorship",
      "Dignity kits",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(data) }}
    />
  );
}
