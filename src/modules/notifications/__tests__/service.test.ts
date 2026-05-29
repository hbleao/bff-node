import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsService } from "../service";
import type {
	INotificationsRepository,
	ListNotificationsResult,
	Notification,
	SendNotificationPayload,
} from "../types";

const mockNotification: Notification = {
	id: "notif-1",
	userId: "u1",
	type: "in_app",
	title: "Welcome",
	message: "Hello there",
	read: false,
	createdAt: "2026-01-01T00:00:00Z",
};

const mockListResult: ListNotificationsResult = {
	items: [mockNotification],
	total: 1,
	page: 1,
	limit: 20,
};

const mockSendPayload: SendNotificationPayload = {
	userId: "u1",
	type: "push",
	title: "New offer",
	message: "Check it out",
};

describe("NotificationsService", () => {
	let repository: INotificationsRepository;
	let service: NotificationsService;

	beforeEach(() => {
		repository = {
			listByUser: vi.fn(),
			send: vi.fn(),
			markAsRead: vi.fn(),
		};
		service = new NotificationsService(repository);
	});

	describe("listByUser", () => {
		it("returns paginated notifications from repository", async () => {
			vi.mocked(repository.listByUser).mockResolvedValueOnce(mockListResult);

			const result = await service.listByUser("u1", 1, 20, false);

			expect(result).toEqual(mockListResult);
			expect(repository.listByUser).toHaveBeenCalledWith("u1", 1, 20, false);
		});

		it("propagates repository errors", async () => {
			vi.mocked(repository.listByUser).mockRejectedValueOnce(
				new Error("upstream failed"),
			);

			await expect(service.listByUser("u1", 1, 20, false)).rejects.toThrow(
				"upstream failed",
			);
		});
	});

	describe("send", () => {
		it("creates and returns the new notification", async () => {
			vi.mocked(repository.send).mockResolvedValueOnce(mockNotification);

			const result = await service.send(mockSendPayload);

			expect(result).toEqual(mockNotification);
			expect(repository.send).toHaveBeenCalledWith(mockSendPayload);
		});
	});

	describe("markAsRead", () => {
		it("delegates to repository with notification id", async () => {
			vi.mocked(repository.markAsRead).mockResolvedValueOnce(undefined);

			await service.markAsRead("notif-1");

			expect(repository.markAsRead).toHaveBeenCalledWith("notif-1");
		});
	});
});
