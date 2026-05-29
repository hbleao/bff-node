import type { Request, Response } from "express";
import {
	getRecommendationsParamsSchema,
	getRecommendationsQuerySchema,
	getUserProfileParamsSchema,
	trackEventBodySchema,
} from "./schemas";
import type { IMarketingCloudPersonalizationService } from "./types";

export class MarketingCloudPersonalizationController {
	constructor(
		private readonly service: IMarketingCloudPersonalizationService,
	) {}

	async getProfile(req: Request, res: Response): Promise<void> {
		const { userId } = getUserProfileParamsSchema.parse(req.params);
		const profile = await this.service.getProfile(userId);
		res.json(profile);
	}

	async trackEvent(req: Request, res: Response): Promise<void> {
		const payload = trackEventBodySchema.parse(req.body);
		await this.service.trackEvent(payload);
		res.status(204).send();
	}

	async getRecommendations(req: Request, res: Response): Promise<void> {
		const { userId } = getRecommendationsParamsSchema.parse(req.params);
		const { limit } = getRecommendationsQuerySchema.parse(req.query);
		const result = await this.service.getRecommendations(userId, limit);
		res.json(result);
	}
}
