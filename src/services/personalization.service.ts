import { logger } from "../config/logger";
import type { IBcpRepository } from "../repositories/interfaces/bcp.repository.interface";
import type { ISalesforcePersonalizationRepository } from "../repositories/interfaces/salesforce-personalization.repository.interface";
import type {
	IPersonalizationService,
	TrackEventDTO,
} from "./interfaces/personalization.service.interface";

export class PersonalizationService implements IPersonalizationService {
	constructor(
		private readonly bcpRepository: IBcpRepository,
		private readonly sfRepository: ISalesforcePersonalizationRepository,
	) {}

	async trackEvent(data: TrackEventDTO): Promise<void> {
		const { userId, action, itemId } = data;

		logger.info("Tracking personalization event", { userId, action, itemId });

		const [userProfile, itemData] = await Promise.all([
			this.bcpRepository.getUserProfile(userId),
			itemId ? this.bcpRepository.getItemData(itemId) : Promise.resolve(null),
		]);

		await this.sfRepository.sendEvent({
			action,
			userId: userProfile.id,
			userAttributes: {
				...(userProfile.email && { emailAddress: userProfile.email }),
				...(userProfile.segment && { segment: userProfile.segment }),
				...userProfile.attributes,
			},
			...(itemData && {
				itemId: itemData.id,
				itemAttributes: {
					...(itemData.name && { name: itemData.name }),
					...(itemData.category && { category: itemData.category }),
					...(itemData.price !== undefined && { price: itemData.price }),
					...itemData.attributes,
				},
			}),
		});

		logger.info("Personalization event sent", { userId, action, itemId });
	}
}
