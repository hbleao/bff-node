import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../errors/app-error";

export function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			error: err.message,
			code: err.code,
		});
		return;
	}

	if (err instanceof ZodError) {
		res.status(422).json({
			error: "Validation error",
			details: err.flatten().fieldErrors,
		});
		return;
	}

	logger.error({
		msg: "Unhandled error",
		error: err.message,
		stack: err.stack,
	});

	res.status(500).json({ error: "Internal server error" });
}
