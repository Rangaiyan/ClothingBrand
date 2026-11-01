import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  authorName: z.string().trim().min(2, "Enter the customer's name").max(60),
  rating: z.coerce.number({ error: "Choose a rating" }).int().min(1, "1 to 5").max(5, "1 to 5"),
  title: z.string().trim().min(2, "Add a short title").max(120),
  body: z.string().trim().min(5, "Write the review").max(2000),
  date: z.string().min(1, "Choose a date"),
  published: z.boolean(),
});

export type ReviewForm = z.input<typeof reviewSchema>;
export type ReviewValues = z.output<typeof reviewSchema>;
