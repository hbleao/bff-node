import type { HttpClient } from "../../shared/http/http-client";
import type {
	IMarketingCloudPersonalizationRepository,
	RecommendationsResult,
	TrackEventPayload,
	UserProfile,
} from "./types";

export class MarketingCloudPersonalizationRepository
	implements IMarketingCloudPersonalizationRepository
{
	constructor(private readonly http: HttpClient) {}

	async getUserProfile(userId: string): Promise<UserProfile> {
		return this.http.get<UserProfile>(`/users/${userId}/profile`);
	}

	async trackEvent(payload: TrackEventPayload): Promise<void> {
		await this.http.post<void>("/events", payload);
	}

	async getRecommendations(
		userId: string,
		limit: number,
	): Promise<RecommendationsResult> {
		return this.http.get<RecommendationsResult>(
			`/users/${userId}/recommendations?limit=${limit}`,
		);
	}
}
