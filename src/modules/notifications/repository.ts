import type { HttpClient } from "../../shared/http/http-client";
import type {
	INotificationsRepository,
	ListNotificationsResult,
	Notification,
	SendNotificationPayload,
} from "./types";

export class NotificationsRepository implements INotificationsRepository {
	constructor(private readonly http: HttpClient) {}

	async listByUser(
		userId: string,
		page: number,
		limit: number,
		unreadOnly: boolean,
	): Promise<ListNotificationsResult> {
		const params = new URLSearchParams({
			page: String(page),
			limit: String(limit),
			unreadOnly: String(unreadOnly),
		});
		return this.http.get<ListNotificationsResult>(
			`/users/${userId}/notifications?${params}`,
		);
	}

	async send(payload: SendNotificationPayload): Promise<Notification> {
		return this.http.post<Notification>("/notifications", payload);
	}

	async markAsRead(notificationId: string): Promise<void> {
		await this.http.patch<void>(`/notifications/${notificationId}/read`);
	}
}
