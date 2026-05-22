export interface TrackEventDTO {
	userId: string;
	action: string;
	itemId?: string;
}

export interface IPersonalizationService {
	trackEvent(data: TrackEventDTO): Promise<void>;
}
