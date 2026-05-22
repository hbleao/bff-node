import { env } from "../config";
import { AppError } from "../errors/app-error";
import type {
	BcpItemData,
	BcpUserProfile,
	IBcpRepository,
} from "./interfaces/bcp.repository.interface";

export class BcpRepository implements IBcpRepository {
	private readonly baseUrl: string;
	private readonly headers: Record<string, string>;

	constructor() {
		const { BCP_BASE_URL, BCP_API_KEY } = env;
		if (!BCP_BASE_URL || !BCP_API_KEY) {
			throw new AppError(
				"BCP_BASE_URL and BCP_API_KEY must be configured",
				500,
			);
		}
		this.baseUrl = BCP_BASE_URL;
		this.headers = {
			Authorization: `Bearer ${BCP_API_KEY}`,
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
