import { type IRouter, Router } from "express";
import { PersonalizationController } from "../controllers/personalization.controller";
import { BcpRepository } from "../repositories/bcp.repository";
import { SalesforcePersonalizationRepository } from "../repositories/salesforce-personalization.repository";
import { PersonalizationService } from "../services/personalization.service";

// Lazy singleton — repositories are only instantiated on the first request,
// so the app starts without requiring these env vars to be set.
let controller: PersonalizationController | null = null;

function getController(): PersonalizationController {
	if (!controller) {
		controller = new PersonalizationController(
			new PersonalizationService(
				new BcpRepository(),
				new SalesforcePersonalizationRepository(),
			),
		);
	}
	return controller;
}

const router: IRouter = Router();

router.post("/events", (req, res) => getController().trackEvent(req, res));

export { router as personalizationRoutes };
