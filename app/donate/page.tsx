import { DonationExperience } from "@/components/donation/DonationExperience";
import { publishedDonations } from "@/lib/cms/public-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Support A Girl",
  description:
    "Give toward dignity kits, menstrual health, vocational training, entrepreneurship or general support. M-Pesa, bank and M-Changa details are published when the organisation confirms them.",
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
      initialCause={cause}
      startWizard={give !== undefined}
      methods={donations.methods}
      intro={donations.intro}
    />
  );
}
