import { Router } from "express";
import type { MarketingCloudPersonalizationController } from "./controller";

export function createMcpRouter(
	controller: MarketingCloudPersonalizationController,
): Router {
	const router = Router();

	router.get("/profile/:userId", (req, res, next) =>
		controller.getProfile(req, res).catch(next),
	);

	router.post("/events", (req, res, next) =>
		controller.trackEvent(req, res).catch(next),
	);

	router.get("/recommendations/:userId", (req, res, next) =>
		controller.getRecommendations(req, res).catch(next),
	);

	return router;
}
