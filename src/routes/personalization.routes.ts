import { type IRouter, Router } from "express";
import type { Container } from "../container";

export function createPersonalizationRouter(container: Container): IRouter {
	const router: IRouter = Router();
	const { personalizationController } = container;

	if (personalizationController) {
		router.post("/events", personalizationController.trackEvent);
	}

	return router;
}
