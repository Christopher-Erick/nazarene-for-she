import { z } from "zod";

const intentValues = [
  "general",
  "partnership",
  "mentorship",
  "donation",
  "resources",
  "prayer",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please share your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  intent: z.enum(intentValues),
  organisation: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(12, "Please tell us a little more.").max(4000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactPayload = z.infer<typeof contactSchema>;
export const contactIntents = intentValues;
