import type { ErrorRequestHandler } from "express";
import { ZodError, z } from "zod";
import { logger } from "../../config/logger";
import { AppError } from "../errors/app-error";

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
	if (err instanceof ZodError) {
		res.status(422).json({
			error: "Validation error",
			code: "VALIDATION_ERROR",
			details: z.flattenError(err).fieldErrors,
		});
		return;
	}

	if (err instanceof AppError) {
		if (err.statusCode >= 500) {
			logger.error(err.message, { stack: err.stack, path: req.path });
		}
		res.status(err.statusCode).json({
			error: err.message,
			code: err.code,
		});
		return;
	}

	logger.error("Unhandled error", { error: err, path: req.path });
	res
		.status(500)
		.json({ error: "Internal server error", code: "INTERNAL_ERROR" });
};
