import type { NextFunction, Request, Response } from "express";
import { httpRequestDuration } from "../config/metrics";

export function metricsMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const end = httpRequestDuration.startTimer();

	res.on("finish", () => {
		// Use the matched route pattern (e.g. /api/v1/users/:id) instead of the
		// raw path to avoid high cardinality from dynamic segments like UUIDs.
		const route = req.route?.path
			? `${req.baseUrl}${req.route.path}`
			: req.path;

		end({
			method: req.method,
			route,
			status_code: res.statusCode,
		});
	});

	next();
}
