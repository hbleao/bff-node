import type { RequestHandler } from "express";
import { logger } from "../../config/logger";

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
	const start = Date.now();

	res.on("finish", () => {
		logger.info("HTTP request", {
			method: req.method,
			path: req.path,
			statusCode: res.statusCode,
			durationMs: Date.now() - start,
		});
	});

	next();
};
