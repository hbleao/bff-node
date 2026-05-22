import { env } from "../config";
import { AppError } from "../errors/app-error";
import type {
	ISalesforcePersonalizationRepository,
	SalesforcePersonalizationEvent,
} from "./interfaces/salesforce-personalization.repository.interface";

interface TokenCache {
	token: string;
	expiresAt: number;
}

export class SalesforcePersonalizationRepository
	implements ISalesforcePersonalizationRepository
{
	private readonly baseUrl: string;
	private readonly datasetId: string;
	private readonly clientId: string;
	private readonly clientSecret: string;
	private tokenCache: TokenCache | null = null;

	constructor() {
		const {
			SF_PERSONALIZATION_BASE_URL,
			SF_PERSONALIZATION_DATASET_ID,
			SF_PERSONALIZATION_CLIENT_ID,
			SF_PERSONALIZATION_CLIENT_SECRET,
		} = env;

		if (
			!SF_PERSONALIZATION_BASE_URL ||
			!SF_PERSONALIZATION_DATASET_ID ||
			!SF_PERSONALIZATION_CLIENT_ID ||
			!SF_PERSONALIZATION_CLIENT_SECRET
		) {
			throw new AppError(
				"Salesforce Personalization environment variables must be configured",
				500,
			);
		}

		this.baseUrl = SF_PERSONALIZATION_BASE_URL;
		this.datasetId = SF_PERSONALIZATION_DATASET_ID;
		this.clientId = SF_PERSONALIZATION_CLIENT_ID;
		this.clientSecret = SF_PERSONALIZATION_CLIENT_SECRET;
	}

	private async getAccessToken(): Promise<string> {
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.token;
		}

		const res = await fetch(env.SF_PERSONALIZATION_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "client_credentials",
				client_id: this.clientId,
				client_secret: this.clientSecret,
			}),
		});

		if (!res.ok) {
			throw new AppError(
				"Failed to obtain Salesforce Personalization access token",
				502,
			);
		}

		const data = (await res.json()) as {
			access_token: string;
			expires_in: number;
		};

		// 60-second buffer before real expiry to avoid using a nearly-expired token
		this.tokenCache = {
			token: data.access_token,
			expiresAt: Date.now() + (data.expires_in - 60) * 1000,
		};

		return this.tokenCache.token;
	}

	async sendEvent(event: SalesforcePersonalizationEvent): Promise<void> {
		const token = await this.getAccessToken();

		const payload = {
			action: event.action,
			user: {
				id: event.userId,
				...(event.userAttributes && { attributes: event.userAttributes }),
			},
			...(event.itemId && {
				catalog: {
					Item: {
						id: event.itemId,
						...(event.itemAttributes && {
							attributes: event.itemAttributes,
						}),
					},
				},
			}),
		};

		const res = await fetch(`${this.baseUrl}/api2/event/${this.datasetId}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			throw new AppError(
				`Salesforce Personalization API error: ${res.status}`,
				502,
			);
		}
	}
}
