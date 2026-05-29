import type { RequestHandler } from "express";
import { httpRequestCounter, httpRequestDuration } from "../../config/metrics";

export const metricsMiddleware: RequestHandler = (req, res, next) => {
	const end = httpRequestDuration.startTimer();

	res.on("finish", () => {
		const route = req.route?.path ?? req.path;
		const labels = {
			method: req.method,
			route,
			status_code: String(res.statusCode),
		};
		httpRequestCounter.inc(labels);
		end(labels);
	});

	next();
};
