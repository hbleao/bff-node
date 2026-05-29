export interface UserProfile {
	userId: string;
	email: string;
	attributes: Record<string, unknown>;
	segments: string[];
	updatedAt: string;
}

export interface TrackEventPayload {
	userId: string;
	eventType: string;
	channel: string;
	attributes?: Record<string, unknown>;
}

export interface Recommendation {
	id: string;
	type: string;
	title: string;
	description: string;
	imageUrl?: string;
	ctaUrl?: string;
	score: number;
}

export interface RecommendationsResult {
	userId: string;
	items: Recommendation[];
}

export interface IMarketingCloudPersonalizationRepository {
	getUserProfile(userId: string): Promise<UserProfile>;
	trackEvent(payload: TrackEventPayload): Promise<void>;
	getRecommendations(
		userId: string,
		limit: number,
	): Promise<RecommendationsResult>;
}

export interface IMarketingCloudPersonalizationService {
	getProfile(userId: string): Promise<UserProfile>;
	trackEvent(payload: TrackEventPayload): Promise<void>;
	getRecommendations(
		userId: string,
		limit: number,
	): Promise<RecommendationsResult>;
}
