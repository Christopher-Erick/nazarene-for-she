import { DonationExperience } from "@/components/donation/DonationExperience";
import { publishedDonations } from "@/lib/cms/public-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Donate: Keep a Girl in School",
  description:
    "Donate to Nazarene for She: fund sanitary pads, dignity kits, menstrual health and vocational training for girls in Kawangware, Nairobi, Kenya.",
  path: "/donate",
});

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ cause?: string; give?: string }>;
}) {
  const { cause, give } = await searchParams;
  const donations = await publishedDonations();
  return (
    <DonationExperience
      key={`${cause ?? ""}:${give ?? ""}`}
      initialCause={cause}
      startWizard={give !== undefined}
      methods={donations.methods}
      intro={donations.intro}
    />
  );
}
