import type { Request, Response } from "express";
import { trackEventSchema } from "../schemas/personalization.schemas";
import type { IPersonalizationService } from "../services/interfaces/personalization.service.interface";

export class PersonalizationController {
	constructor(
		private readonly personalizationService: IPersonalizationService,
	) {}

	trackEvent = async (req: Request, res: Response): Promise<void> => {
		const body = trackEventSchema.parse(req.body);
		await this.personalizationService.trackEvent(body);
		res.status(204).send();
	};
}
