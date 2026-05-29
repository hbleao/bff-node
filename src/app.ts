import "express-async-errors";
import compression from "compression";
import cors from "cors";
import express from "express";
import actuator from "express-actuator";
import helmet from "helmet";

import { metricsRegistry } from "./config/metrics";
import type { AppRouters } from "./container";
import {
	errorMiddleware,
	metricsMiddleware,
	requestLoggerMiddleware,
} from "./shared/middlewares";

export function createApp(routers: AppRouters): express.Application {
	const app = express();

	app.use(helmet());
	app.use(cors());
	app.use(compression());
	app.use(express.json());
	app.use(requestLoggerMiddleware);
	app.use(metricsMiddleware);
	app.use(actuator());

	app.get("/metrics", async (_req, res) => {
		res.set("Content-Type", metricsRegistry.contentType);
		res.send(await metricsRegistry.metrics());
	});

	app.use("/mcp", routers.mcpRouter);
	app.use("/notifications", routers.notificationsRouter);

	app.use(errorMiddleware);

	return app;
}
