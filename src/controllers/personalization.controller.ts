import type { Request, Response } from "express";
import { z } from "zod";
import type { IPersonalizationService } from "../services/interfaces/personalization.service.interface";

const trackEventSchema = z.object({
	userId: z.string().min(1),
	action: z.string().min(1),
	itemId: z.string().min(1).optional(),
});

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
