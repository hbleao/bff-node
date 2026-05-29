import { z } from "zod";

const notificationTypeSchema = z.enum(["email", "push", "sms", "in_app"]);

export const listNotificationsParamsSchema = z.object({
	userId: z.string().min(1),
});

export const listNotificationsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	unreadOnly: z
		.string()
		.optional()
		.transform((v) => v === "true"),
});

export const notificationSchema = z.object({
	id: z.string(),
	userId: z.string(),
	type: notificationTypeSchema,
	title: z.string(),
	message: z.string(),
	read: z.boolean(),
	data: z.record(z.string(), z.unknown()).optional(),
	createdAt: z.string(),
});

export const listNotificationsResponseSchema = z.object({
	items: z.array(notificationSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});

export const sendNotificationBodySchema = z.object({
	userId: z.string().min(1),
	type: notificationTypeSchema,
	title: z.string().min(1).max(120),
	message: z.string().min(1).max(1000),
	data: z.record(z.string(), z.unknown()).optional(),
});

export const markAsReadParamsSchema = z.object({
	notificationId: z.string().min(1),
});

export type ListNotificationsParams = z.infer<
	typeof listNotificationsParamsSchema
>;
export type ListNotificationsQuery = z.infer<
	typeof listNotificationsQuerySchema
>;
export type SendNotificationBody = z.infer<typeof sendNotificationBodySchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;
