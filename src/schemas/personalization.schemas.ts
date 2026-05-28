import { z } from "zod";

export const trackEventSchema = z.object({
	userId: z.string().min(1),
	action: z.string().min(1),
	itemId: z.string().min(1).optional(),
});
