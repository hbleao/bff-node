import type { Router } from "express";
import { env } from "./config/env";
import { MarketingCloudPersonalizationController } from "./modules/marketingCloudPersonalization/controller";
import { MarketingCloudPersonalizationRepository } from "./modules/marketingCloudPersonalization/repository";
import { createMcpRouter } from "./modules/marketingCloudPersonalization/routes";
import { MarketingCloudPersonalizationService } from "./modules/marketingCloudPersonalization/service";
import { NotificationsController } from "./modules/notifications/controller";
import { NotificationsRepository } from "./modules/notifications/repository";
import { createNotificationsRouter } from "./modules/notifications/routes";
import { NotificationsService } from "./modules/notifications/service";
import { HttpClient } from "./shared/http/http-client";

function buildMcpModule() {
	const http = new HttpClient({
		baseUrl: env.MCP_BASE_URL,
		defaultHeaders: { "x-api-key": env.MCP_API_KEY },
	});
	const repository = new MarketingCloudPersonalizationRepository(http);
	const service = new MarketingCloudPersonalizationService(repository);
	const controller = new MarketingCloudPersonalizationController(service);
	return createMcpRouter(controller);
}

function buildNotificationsModule() {
	const http = new HttpClient({
		baseUrl: env.NOTIFICATIONS_BASE_URL,
		defaultHeaders: { "x-api-key": env.NOTIFICATIONS_API_KEY },
	});
	const repository = new NotificationsRepository(http);
	const service = new NotificationsService(repository);
	const controller = new NotificationsController(service);
	return createNotificationsRouter(controller);
}

export interface AppRouters {
	mcpRouter: Router;
	notificationsRouter: Router;
}

export function buildContainer(): AppRouters {
	return {
		mcpRouter: buildMcpModule(),
		notificationsRouter: buildNotificationsModule(),
	};
}
