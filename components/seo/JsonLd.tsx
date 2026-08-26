import { site } from "@/lib/data/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: site.name,
    alternateName: "Nazarene for SHE",
    slogan: site.tagline,
    description: site.description,
    url: site.url,
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    knowsAbout: [
      "Menstrual health Kenya",
      "Period poverty",
      "Girls empowerment",
      "Vocational training",
      "Mentorship",
      "Dignity kits",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
