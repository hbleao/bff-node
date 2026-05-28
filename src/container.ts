import { env } from "./config";
import { PersonalizationController } from "./controllers/personalization.controller";
import { UserController } from "./controllers/user.controller";
import { BcpRepository } from "./repositories/bcp.repository";
import { SalesforcePersonalizationRepository } from "./repositories/salesforce-personalization.repository";
import { UserRepository } from "./repositories/user.repository";
import { PersonalizationService } from "./services/personalization.service";
import { UserService } from "./services/user.service";

function buildPersonalizationController(): PersonalizationController | null {
	const {
		BCP_BASE_URL,
		BCP_API_KEY,
		SF_PERSONALIZATION_BASE_URL,
		SF_PERSONALIZATION_DATASET_ID,
		SF_PERSONALIZATION_CLIENT_ID,
		SF_PERSONALIZATION_CLIENT_SECRET,
		SF_PERSONALIZATION_TOKEN_URL,
	} = env;

	if (
		!BCP_BASE_URL ||
		!BCP_API_KEY ||
		!SF_PERSONALIZATION_BASE_URL ||
		!SF_PERSONALIZATION_DATASET_ID ||
		!SF_PERSONALIZATION_CLIENT_ID ||
		!SF_PERSONALIZATION_CLIENT_SECRET
	) {
		return null;
	}

	const bcpRepository = new BcpRepository({
		baseUrl: BCP_BASE_URL,
		apiKey: BCP_API_KEY,
	});

	const sfRepository = new SalesforcePersonalizationRepository({
		baseUrl: SF_PERSONALIZATION_BASE_URL,
		datasetId: SF_PERSONALIZATION_DATASET_ID,
		clientId: SF_PERSONALIZATION_CLIENT_ID,
		clientSecret: SF_PERSONALIZATION_CLIENT_SECRET,
		tokenUrl: SF_PERSONALIZATION_TOKEN_URL,
	});

	return new PersonalizationController(
		new PersonalizationService(bcpRepository, sfRepository),
	);
}

export function createContainer() {
	const userRepository = new UserRepository();
	const userController = new UserController(new UserService(userRepository));
	const personalizationController = buildPersonalizationController();

	return { userController, personalizationController };
}

export type Container = ReturnType<typeof createContainer>;
