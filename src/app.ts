import "express-async-errors";
import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env, logger } from "./config";
import { errorMiddleware, requestLogger } from "./middlewares";
import { router } from "./routes";

const app: Application = express();

// Security headers
app.use(helmet());

// Restrict direct access to requests coming from MuleSoft only
app.use(
	cors({
		origin: env.MULESOFT_ORIGIN,
		methods: ["GET", "POST", "PATCH", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Body parsing & compression
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression());

// Request logging
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "ok", env: env.NODE_ENV });
});

// Routes
app.use("/api/v1", router);

// Error handler (must be last)
app.use(errorMiddleware);

export { app };
