import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketingCloudPersonalizationService } from "../service";
import type {
	IMarketingCloudPersonalizationRepository,
	RecommendationsResult,
	TrackEventPayload,
	UserProfile,
} from "../types";

const mockProfile: UserProfile = {
	userId: "u1",
	email: "user@example.com",
	attributes: { plan: "pro" },
	segments: ["high-value"],
	updatedAt: "2026-01-01T00:00:00Z",
};

const mockRecommendations: RecommendationsResult = {
	userId: "u1",
	items: [
		{
			id: "rec-1",
			type: "product",
			title: "Item A",
			description: "Great item",
			score: 0.95,
		},
	],
};

const mockTrackPayload: TrackEventPayload = {
	userId: "u1",
	eventType: "page_view",
	channel: "web",
};

describe("MarketingCloudPersonalizationService", () => {
	let repository: IMarketingCloudPersonalizationRepository;
	let service: MarketingCloudPersonalizationService;

	beforeEach(() => {
		repository = {
			getUserProfile: vi.fn(),
			trackEvent: vi.fn(),
			getRecommendations: vi.fn(),
		};
		service = new MarketingCloudPersonalizationService(repository);
	});

	describe("getProfile", () => {
		it("returns the profile from repository", async () => {
			vi.mocked(repository.getUserProfile).mockResolvedValueOnce(mockProfile);

			const result = await service.getProfile("u1");

			expect(result).toEqual(mockProfile);
			expect(repository.getUserProfile).toHaveBeenCalledWith("u1");
		});

		it("propagates repository errors", async () => {
			vi.mocked(repository.getUserProfile).mockRejectedValueOnce(
				new Error("upstream failed"),
			);

			await expect(service.getProfile("u1")).rejects.toThrow("upstream failed");
		});
	});

	describe("trackEvent", () => {
		it("delegates to repository with the full payload", async () => {
			vi.mocked(repository.trackEvent).mockResolvedValueOnce(undefined);

			await service.trackEvent(mockTrackPayload);

			expect(repository.trackEvent).toHaveBeenCalledWith(mockTrackPayload);
		});
	});

	describe("getRecommendations", () => {
		it("returns recommendations from repository", async () => {
			vi.mocked(repository.getRecommendations).mockResolvedValueOnce(
				mockRecommendations,
			);

			const result = await service.getRecommendations("u1", 5);

			expect(result).toEqual(mockRecommendations);
			expect(repository.getRecommendations).toHaveBeenCalledWith("u1", 5);
		});
	});
});
