import { AppError } from "../errors/app-error";
import type {
	BcpItemData,
	BcpUserProfile,
	IBcpRepository,
} from "./interfaces/bcp.repository.interface";

export interface BcpConfig {
	baseUrl: string;
	apiKey: string;
}

export class BcpRepository implements IBcpRepository {
	private readonly baseUrl: string;
	private readonly headers: Record<string, string>;

	constructor(config: BcpConfig) {
		this.baseUrl = config.baseUrl;
		this.headers = {
			Authorization: `Bearer ${config.apiKey}`,
			"Content-Type": "application/json",
		};
	}

	async getUserProfile(userId: string): Promise<BcpUserProfile> {
		const res = await fetch(`${this.baseUrl}/users/${userId}`, {
			headers: this.headers,
		});

		if (res.status === 404) {
			throw new AppError(`User ${userId} not found in BCP`, 404);
		}
		if (!res.ok) {
			throw new AppError(`BCP API error: ${res.status}`, 502);
		}

		return res.json() as Promise<BcpUserProfile>;
	}

	async getItemData(itemId: string): Promise<BcpItemData> {
		const res = await fetch(`${this.baseUrl}/items/${itemId}`, {
			headers: this.headers,
		});

		if (res.status === 404) {
			throw new AppError(`Item ${itemId} not found in BCP`, 404);
		}
		if (!res.ok) {
			throw new AppError(`BCP API error: ${res.status}`, 502);
		}

		return res.json() as Promise<BcpItemData>;
	}
}
