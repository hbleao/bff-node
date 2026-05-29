import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { errorMiddleware } from "../error.middleware";

function makeRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
	return res;
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

describe("errorMiddleware", () => {
	it("handles ZodError with 422 and fieldErrors", () => {
		const zodErr = z.object({ name: z.string() }).safeParse({ name: 123 });
		const res = makeRes();

		errorMiddleware((zodErr as { success: false }).error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(422);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				code: "VALIDATION_ERROR",
				details: expect.objectContaining({ name: expect.any(Array) }),
			}),
		);
	});

	it("handles AppError with its statusCode and code", () => {
		const appErr = AppError.notFound("user not found", "USER_NOT_FOUND");
		const res = makeRes();

		errorMiddleware(appErr, req, res, next);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			error: "user not found",
			code: "USER_NOT_FOUND",
		});
	});

	it("handles unknown errors with 500", () => {
		const unknownErr = new Error("something exploded");
		const res = makeRes();

		errorMiddleware(unknownErr, req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ code: "INTERNAL_ERROR" }),
		);
	});
});
