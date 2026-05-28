import { z } from "zod";

export const createUserSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.email(),
});

export const updateUserSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	email: z.email().optional(),
});
