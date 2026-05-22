import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { requestContext } from "../config/request-context";

export function requestLogger(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const requestId =
		(req.headers["x-request-id"] as string | undefined) ?? randomUUID();

	res.setHeader("X-Request-ID", requestId);

	requestContext.run(requestId, () => {
		const start = Date.now();

		res.on("finish", () => {
			const durationMs = Date.now() - start;
			const isSlow = durationMs >= env.SLOW_REQUEST_THRESHOLD_MS;

			const meta = {
				method: req.method,
				path: req.path,
				statusCode: res.statusCode,
				durationMs,
				ip: req.ip,
			};

			if (isSlow) {
				logger.warn("Slow HTTP request", meta);
			} else {
				logger.info("HTTP request", meta);
			}
		});

		next();
	});
}
