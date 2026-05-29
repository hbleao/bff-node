import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { errorMiddleware } from "../../../shared/middlewares/error.middleware";
import { NotificationsController } from "../controller";
import { createNotificationsRouter } from "../routes";
import type {
	INotificationsService,
	ListNotificationsResult,
	Notification,
} from "../types";

function buildApp(service: INotificationsService) {
	const app = express();
	app.use(express.json());
	const controller = new NotificationsController(service);
	app.use("/notifications", createNotificationsRouter(controller));
	app.use(errorMiddleware);
	return app;
}

const mockNotification: Notification = {
	id: "notif-1",
	userId: "u1",
	type: "in_app",
	title: "Hello",
	message: "You have a new message",
	read: false,
	createdAt: "2026-01-01T00:00:00Z",
};

const mockListResult: ListNotificationsResult = {
	items: [mockNotification],
	total: 1,
	page: 1,
	limit: 20,
};

describe("Notifications routes — integration", () => {
	let service: INotificationsService;

	beforeEach(() => {
		service = {
			listByUser: vi.fn(),
			send: vi.fn(),
			markAsRead: vi.fn(),
		};
	});

	describe("GET /notifications/:userId", () => {
		it("200 — returns paginated notifications", async () => {
			vi.mocked(service.listByUser).mockResolvedValueOnce(mockListResult);
			const app = buildApp(service);

			const res = await request(app).get("/notifications/u1");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(mockListResult);
			expect(service.listByUser).toHaveBeenCalledWith("u1", 1, 20, false);
		});

		it("200 — passes unreadOnly=true from query string", async () => {
			vi.mocked(service.listByUser).mockResolvedValueOnce(mockListResult);
			const app = buildApp(service);

			await request(app).get("/notifications/u1?unreadOnly=true");

			expect(service.listByUser).toHaveBeenCalledWith("u1", 1, 20, true);
		});

		it("200 — passes pagination params", async () => {
			vi.mocked(service.listByUser).mockResolvedValueOnce(mockListResult);
			const app = buildApp(service);

			await request(app).get("/notifications/u1?page=2&limit=10");

			expect(service.listByUser).toHaveBeenCalledWith("u1", 2, 10, false);
		});

		it("404 — service throws AppError.notFound", async () => {
			vi.mocked(service.listByUser).mockRejectedValueOnce(
				AppError.notFound("user not found", "USER_NOT_FOUND"),
			);
			const app = buildApp(service);

			const res = await request(app).get("/notifications/u1");

			expect(res.status).toBe(404);
			expect(res.body.code).toBe("USER_NOT_FOUND");
		});
	});

	describe("POST /notifications", () => {
		it("201 — creates and returns notification", async () => {
			vi.mocked(service.send).mockResolvedValueOnce(mockNotification);
			const app = buildApp(service);

			const res = await request(app).post("/notifications").send({
				userId: "u1",
				type: "push",
				title: "New deal",
				message: "Limited time offer",
			});

			expect(res.status).toBe(201);
			expect(res.body).toEqual(mockNotification);
		});

		it("422 — missing title returns validation error", async () => {
			const app = buildApp(service);

			const res = await request(app).post("/notifications").send({
				userId: "u1",
				type: "push",
				message: "No title here",
			});

			expect(res.status).toBe(422);
			expect(res.body.code).toBe("VALIDATION_ERROR");
			expect(res.body.details).toHaveProperty("title");
		});

		it("422 — invalid notification type", async () => {
			const app = buildApp(service);

			const res = await request(app).post("/notifications").send({
				userId: "u1",
				type: "carrier_pigeon",
				title: "Greetings",
				message: "From afar",
			});

			expect(res.status).toBe(422);
			expect(res.body.details).toHaveProperty("type");
		});

		it("422 — title exceeds 120 characters", async () => {
			const app = buildApp(service);

			const res = await request(app)
				.post("/notifications")
				.send({
					userId: "u1",
					type: "email",
					title: "a".repeat(121),
					message: "Test",
				});

			expect(res.status).toBe(422);
		});
	});

	describe("PATCH /notifications/:notificationId/read", () => {
		it("204 — marks notification as read", async () => {
			vi.mocked(service.markAsRead).mockResolvedValueOnce(undefined);
			const app = buildApp(service);

			const res = await request(app).patch("/notifications/notif-1/read");

			expect(res.status).toBe(204);
			expect(service.markAsRead).toHaveBeenCalledWith("notif-1");
		});

		it("404 — notification not found", async () => {
			vi.mocked(service.markAsRead).mockRejectedValueOnce(
				AppError.notFound("notification not found", "NOTIFICATION_NOT_FOUND"),
			);
			const app = buildApp(service);

			const res = await request(app).patch("/notifications/notif-999/read");

			expect(res.status).toBe(404);
			expect(res.body.code).toBe("NOTIFICATION_NOT_FOUND");
		});
	});
});
