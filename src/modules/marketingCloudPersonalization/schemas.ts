import { z } from "zod";

export const getUserProfileParamsSchema = z.object({
	userId: z.string().min(1),
});

export const getUserProfileResponseSchema = z.object({
	userId: z.string(),
	email: z.email(),
	attributes: z.record(z.string(), z.unknown()),
	segments: z.array(z.string()),
	updatedAt: z.string(),
});

export const trackEventBodySchema = z.object({
	userId: z.string().min(1),
	eventType: z.string().min(1),
	channel: z.string().min(1),
	attributes: z.record(z.string(), z.unknown()).optional(),
});

export const getRecommendationsParamsSchema = z.object({
	userId: z.string().min(1),
});

export const getRecommendationsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const recommendationItemSchema = z.object({
	id: z.string(),
	type: z.string(),
	title: z.string(),
	description: z.string(),
	imageUrl: z.url().optional(),
	ctaUrl: z.url().optional(),
	score: z.number(),
});

export const getRecommendationsResponseSchema = z.object({
	userId: z.string(),
	items: z.array(recommendationItemSchema),
});

export type GetUserProfileParams = z.infer<typeof getUserProfileParamsSchema>;
export type TrackEventBody = z.infer<typeof trackEventBodySchema>;
export type GetRecommendationsParams = z.infer<
	typeof getRecommendationsParamsSchema
>;
export type GetRecommendationsQuery = z.infer<
	typeof getRecommendationsQuerySchema
>;
