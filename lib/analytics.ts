export const analyticsEvents = {
  donationCtaClicked: "donation_cta_clicked",
  donationMethodSelected: "donation_method_selected",
  contactFormSubmitted: "contact_form_submitted",
  mentorshipInquiry: "mentorship_inquiry",
  partnershipInquiry: "partnership_inquiry",
  programViewed: "program_viewed",
  storyViewed: "story_viewed",
} as const;

export type AnalyticsEvent = (typeof analyticsEvents)[keyof typeof analyticsEvents];

export function trackEvent(event: AnalyticsEvent, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("nfs:analytics", { detail: { event, ...detail } }));
}
