import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { errorMiddleware } from "../../../shared/middlewares/error.middleware";
import { MarketingCloudPersonalizationController } from "../controller";
import { createMcpRouter } from "../routes";
import type { IMarketingCloudPersonalizationService } from "../types";

function buildApp(service: IMarketingCloudPersonalizationService) {
	const app = express();
	app.use(express.json());
	const controller = new MarketingCloudPersonalizationController(service);
	app.use("/mcp", createMcpRouter(controller));
	app.use(errorMiddleware);
	return app;
}

const mockProfile = {
	userId: "u1",
	email: "user@example.com",
	attributes: { plan: "pro" },
	segments: ["vip"],
	updatedAt: "2026-01-01T00:00:00Z",
};

const mockRecommendations = {
	userId: "u1",
	items: [
		{ id: "r1", type: "product", title: "A", description: "B", score: 0.9 },
	],
};

describe("MCP routes — integration", () => {
	let service: IMarketingCloudPersonalizationService;

	beforeEach(() => {
		service = {
			getProfile: vi.fn(),
			trackEvent: vi.fn(),
			getRecommendations: vi.fn(),
		};
	});

	describe("GET /mcp/profile/:userId", () => {
		it("200 — returns user profile", async () => {
			vi.mocked(service.getProfile).mockResolvedValueOnce(mockProfile);
			const app = buildApp(service);

			const res = await request(app).get("/mcp/profile/u1");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(mockProfile);
			expect(service.getProfile).toHaveBeenCalledWith("u1");
		});

		it("404 — service throws AppError.notFound", async () => {
			vi.mocked(service.getProfile).mockRejectedValueOnce(
				AppError.notFound("profile not found", "PROFILE_NOT_FOUND"),
			);
			const app = buildApp(service);

			const res = await request(app).get("/mcp/profile/u1");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({
				error: "profile not found",
				code: "PROFILE_NOT_FOUND",
			});
		});

		it("502 — service throws generic error → 500", async () => {
			vi.mocked(service.getProfile).mockRejectedValueOnce(
				new Error("network failure"),
			);
			const app = buildApp(service);

			const res = await request(app).get("/mcp/profile/u1");

			expect(res.status).toBe(500);
		});
	});

	describe("POST /mcp/events", () => {
		it("204 — valid payload returns no content", async () => {
			vi.mocked(service.trackEvent).mockResolvedValueOnce(undefined);
			const app = buildApp(service);

			const res = await request(app).post("/mcp/events").send({
				userId: "u1",
				eventType: "page_view",
				channel: "web",
			});

			expect(res.status).toBe(204);
			expect(service.trackEvent).toHaveBeenCalledWith({
				userId: "u1",
				eventType: "page_view",
				channel: "web",
			});
		});

		it("422 — missing required field returns validation error", async () => {
			const app = buildApp(service);

			const res = await request(app).post("/mcp/events").send({
				userId: "u1",
				eventType: "page_view",
			});

			expect(res.status).toBe(422);
			expect(res.body.code).toBe("VALIDATION_ERROR");
			expect(res.body.details).toHaveProperty("channel");
		});

		it("422 — empty body returns validation error", async () => {
			const app = buildApp(service);

			const res = await request(app).post("/mcp/events").send({});

			expect(res.status).toBe(422);
		});
	});

	describe("GET /mcp/recommendations/:userId", () => {
		it("200 — returns recommendations with default limit", async () => {
			vi.mocked(service.getRecommendations).mockResolvedValueOnce(
				mockRecommendations,
			);
			const app = buildApp(service);

			const res = await request(app).get("/mcp/recommendations/u1");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(mockRecommendations);
			expect(service.getRecommendations).toHaveBeenCalledWith("u1", 10);
		});

		it("200 — passes custom limit from query string", async () => {
			vi.mocked(service.getRecommendations).mockResolvedValueOnce(
				mockRecommendations,
			);
			const app = buildApp(service);

			await request(app).get("/mcp/recommendations/u1?limit=5");

			expect(service.getRecommendations).toHaveBeenCalledWith("u1", 5);
		});

		it("422 — limit exceeds maximum of 50", async () => {
			const app = buildApp(service);

			const res = await request(app).get("/mcp/recommendations/u1?limit=99");

			expect(res.status).toBe(422);
		});
	});
});
