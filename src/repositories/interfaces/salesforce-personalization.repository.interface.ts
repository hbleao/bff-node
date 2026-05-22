export interface SalesforcePersonalizationEvent {
	action: string;
	userId: string;
	userAttributes?: Record<string, unknown>;
	itemId?: string;
	itemAttributes?: Record<string, unknown>;
}

export interface ISalesforcePersonalizationRepository {
	sendEvent(event: SalesforcePersonalizationEvent): Promise<void>;
}
