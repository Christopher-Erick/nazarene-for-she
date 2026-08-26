import { z } from "zod";
import { donationCategories, donationMethods } from "@/lib/data/donation";

const categoryIds = donationCategories.map((category) => category.id) as [string, ...string[]];
const methodIds = donationMethods.map((method) => method.id) as [string, ...string[]];

export const donationInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  category: z.enum(categoryIds),
  method: z.enum(methodIds),
  amount: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type DonationInquiry = z.infer<typeof donationInquirySchema>;
