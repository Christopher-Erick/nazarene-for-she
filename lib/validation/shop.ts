import { z } from "zod";

/** Must match `garments` slugs and `garmentFits` in lib/data/shop.ts */
const slugEnum = [
  "dress",
  "skirt",
  "blouse",
  "palazzo",
  "kimono",
  "crop-top",
  "jumpsuit",
  "uniform",
  "trouser",
  "jacket",
  "sweater",
  "tote",
  "kitenge",
  "cap",
] as const;
const fitEnum = ["s", "m", "l", "os", "custom"] as const;

const clothEnum = ["plum", "gold", "ivory", "wax"] as const;

export const shopItemSchema = z.object({
  slug: z.enum(slugEnum),
  quantity: z.coerce.number().int().min(1).max(3),
  fit: z.enum(fitEnum),
  cloth: z.enum(clothEnum).optional().default("plum"),
});

export const shopRequestSchema = z.object({
  name: z.string().trim().min(2, "Please share your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  gift: z.boolean().optional().default(false),
  message: z.string().trim().min(12, "Please tell us a little more about the piece.").max(2000),
  items: z.array(shopItemSchema).min(1, "Add at least one piece first.").max(6),
  website: z.string().max(200).optional().default(""),
});

export type ShopRequest = z.infer<typeof shopRequestSchema>;
