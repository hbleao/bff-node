import type {
	INotificationsRepository,
	INotificationsService,
	ListNotificationsResult,
	Notification,
	SendNotificationPayload,
} from "./types";

export class NotificationsService implements INotificationsService {
	constructor(private readonly repository: INotificationsRepository) {}

	async listByUser(
		userId: string,
		page: number,
		limit: number,
		unreadOnly: boolean,
	): Promise<ListNotificationsResult> {
		return this.repository.listByUser(userId, page, limit, unreadOnly);
	}

	async send(payload: SendNotificationPayload): Promise<Notification> {
		return this.repository.send(payload);
	}

	async markAsRead(notificationId: string): Promise<void> {
		return this.repository.markAsRead(notificationId);
	}
}
