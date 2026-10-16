import { site } from "@/lib/data/site";
import { escapeJsonForScript } from "@/lib/security";

export function JsonLd() {
  const organization = {
    "@type": "NGO",
    "@id": `${site.url}/#organization`,
    name: site.name,
    logo: { "@type": "ImageObject", url: `${site.url}/images/logo.png`, width: 407, height: 296 },
    image: `${site.url}/opengraph-image`,
    ...(site.contact.email
      ? { contactPoint: { "@type": "ContactPoint", contactType: "general enquiries", email: site.contact.email, areaServed: "KE", availableLanguage: ["en", "sw"] } }
      : {}),
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
    // Tells search engines these profiles belong to the organisation.
    sameAs: Object.values(site.social).filter((href) => href.startsWith("https://")),
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

  const website = {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    inLanguage: "en-KE",
    publisher: { "@id": `${site.url}/#organization` },
  };
  const data = { "@context": "https://schema.org", "@graph": [organization, website] };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(data) }}
    />
  );
}
