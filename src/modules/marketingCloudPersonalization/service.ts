import type {
	IMarketingCloudPersonalizationRepository,
	IMarketingCloudPersonalizationService,
	RecommendationsResult,
	TrackEventPayload,
	UserProfile,
} from "./types";

export class MarketingCloudPersonalizationService
	implements IMarketingCloudPersonalizationService
{
	constructor(
		private readonly repository: IMarketingCloudPersonalizationRepository,
	) {}

	async getProfile(userId: string): Promise<UserProfile> {
		return this.repository.getUserProfile(userId);
	}

	async trackEvent(payload: TrackEventPayload): Promise<void> {
		return this.repository.trackEvent(payload);
	}

	async getRecommendations(
		userId: string,
		limit: number,
	): Promise<RecommendationsResult> {
		return this.repository.getRecommendations(userId, limit);
	}
}
