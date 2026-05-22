export interface BcpUserProfile {
	id: string;
	email?: string;
	segment?: string;
	attributes?: Record<string, unknown>;
}

export interface BcpItemData {
	id: string;
	name?: string;
	category?: string;
	price?: number;
	attributes?: Record<string, unknown>;
}

export interface IBcpRepository {
	getUserProfile(userId: string): Promise<BcpUserProfile>;
	getItemData(itemId: string): Promise<BcpItemData>;
}
