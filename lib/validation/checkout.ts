import { z } from "zod";

const fitEnum = ["s", "m", "l", "os", "custom"] as const;
const clothEnum = ["plum", "gold", "ivory", "wax"] as const;
const idPattern = /^[a-zA-Z0-9-]{8,80}$/;

export const checkoutItemSchema = z.object({
  productId: z.string().trim().min(8).max(80).regex(idPattern, "Unknown piece."),
  quantity: z.coerce.number().int().min(1).max(10),
  fit: z.enum(fitEnum),
  cloth: z.enum(clothEnum),
});

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Please share your name.").max(120),
    email: z.string().trim().email("Please enter a valid email address.").max(160),
    phone: z.string().trim().max(40).optional().or(z.literal("")).default(""),
    gift: z.boolean().optional().default(false),
    message: z.string().trim().max(2000).optional().or(z.literal("")).default(""),
    delivery: z.string().trim().max(400).optional().or(z.literal("")).default(""),
    channel: z.enum(["web", "whatsapp"]).optional().default("web"),
    items: z.array(checkoutItemSchema).min(1, "Add at least one piece to your cart.").max(12),
    website: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "whatsapp" && !data.phone.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Please share a phone number so the workshop can reach you on WhatsApp.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
