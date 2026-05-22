import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError } from "../errors/app-error";

type ErrorWithCause = Error & { cause?: unknown };

function serializeCause(cause: unknown): unknown {
	if (!(cause instanceof Error)) return cause;
	return {
		message: cause.message,
		name: cause.name,
		...((cause as ErrorWithCause).cause !== undefined && {
			cause: serializeCause((cause as ErrorWithCause).cause),
		}),
	};
}

export function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof AppError) {
		if (err.statusCode >= 500) {
			logger.error("Application error", {
				error: err.message,
				code: err.code,
				stack: err.stack,
				...((err as ErrorWithCause).cause !== undefined && {
					cause: serializeCause((err as ErrorWithCause).cause),
				}),
			});
		}
		res.status(err.statusCode).json({ error: err.message, code: err.code });
		return;
	}

	if (err instanceof ZodError) {
		res.status(422).json({
			error: "Validation error",
			details: err.flatten().fieldErrors,
		});
		return;
	}

	logger.error("Unhandled error", {
		error: err.message,
		stack: err.stack,
		...((err as ErrorWithCause).cause !== undefined && {
			cause: serializeCause((err as ErrorWithCause).cause),
		}),
	});

	res.status(500).json({ error: "Internal server error" });
}
