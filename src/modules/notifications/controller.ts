import type { Request, Response } from "express";
import {
	listNotificationsParamsSchema,
	listNotificationsQuerySchema,
	markAsReadParamsSchema,
	sendNotificationBodySchema,
} from "./schemas";
import type { INotificationsService } from "./types";

export class NotificationsController {
	constructor(private readonly service: INotificationsService) {}

	async listByUser(req: Request, res: Response): Promise<void> {
		const { userId } = listNotificationsParamsSchema.parse(req.params);
		const { page, limit, unreadOnly } = listNotificationsQuerySchema.parse(
			req.query,
		);
		const result = await this.service.listByUser(
			userId,
			page,
			limit,
			unreadOnly,
		);
		res.json(result);
	}

	async send(req: Request, res: Response): Promise<void> {
		const payload = sendNotificationBodySchema.parse(req.body);
		const notification = await this.service.send(payload);
		res.status(201).json(notification);
	}

	async markAsRead(req: Request, res: Response): Promise<void> {
		const { notificationId } = markAsReadParamsSchema.parse(req.params);
		await this.service.markAsRead(notificationId);
		res.status(204).send();
	}
}
