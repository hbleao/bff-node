import "express-async-errors";
import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import actuator from "express-actuator";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { env } from "./config";
import { metricsRegistry } from "./config/metrics";
import { createContainer } from "./container";
import { openApiDocument } from "./docs/openapi";
import {
	errorMiddleware,
	metricsMiddleware,
	requestLogger,
} from "./middlewares";
import { createRouter } from "./routes";

const app: Application = express();

// Security headers
app.use(helmet());

// Prometheus scraping endpoint — registered before CORS so the Prometheus
// server can reach it without needing the MuleSoft origin header.
app.get("/metrics", async (_req, res) => {
	res.set("Content-Type", metricsRegistry.contentType);
	res.end(await metricsRegistry.metrics());
});

// Restrict direct access to requests coming from MuleSoft only
app.use(
	cors({
		origin: env.MULESOFT_ORIGIN,
		methods: ["GET", "POST", "PATCH", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
		exposedHeaders: ["X-Request-ID"],
	}),
);

// Body parsing & compression
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// Request logging + correlation ID
app.use(requestLogger);

// Prometheus HTTP metrics
app.use(metricsMiddleware);

// Observability endpoints: /actuator/health, /actuator/info, /actuator/metrics
app.use(actuator({ basePath: "/actuator" }));

// API docs (dev + staging only)
if (env.NODE_ENV !== "production") {
	app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
	app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}

// Routes
app.use("/api/v1", createRouter(createContainer()));

// Error handler (must be last)
app.use(errorMiddleware);

export { app };
