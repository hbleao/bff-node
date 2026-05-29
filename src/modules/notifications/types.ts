export type NotificationType = "email" | "push" | "sms" | "in_app";

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	read: boolean;
	data?: Record<string, unknown>;
	createdAt: string;
}

export interface ListNotificationsResult {
	items: Notification[];
	total: number;
	page: number;
	limit: number;
}

export interface SendNotificationPayload {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	data?: Record<string, unknown>;
}

export interface INotificationsRepository {
	listByUser(
		userId: string,
		page: number,
		limit: number,
		unreadOnly: boolean,
	): Promise<ListNotificationsResult>;
	send(payload: SendNotificationPayload): Promise<Notification>;
	markAsRead(notificationId: string): Promise<void>;
}

export interface INotificationsService {
	listByUser(
		userId: string,
		page: number,
		limit: number,
		unreadOnly: boolean,
	): Promise<ListNotificationsResult>;
	send(payload: SendNotificationPayload): Promise<Notification>;
	markAsRead(notificationId: string): Promise<void>;
}
