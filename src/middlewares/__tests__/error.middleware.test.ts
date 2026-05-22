import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import { AppError } from "../../errors/app-error";
import { errorMiddleware } from "../error.middleware";

function mockRes(): Response {
	const res = {
		json: vi.fn(),
		status: vi.fn(),
	} as unknown as Response;
	(res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
	return res;
}

const req = {} as Request;
const next = vi.fn() as NextFunction;

function makeZodError(): ZodError {
	try {
		z.object({ email: z.string().email() }).parse({ email: "invalid" });
	} catch (e) {
		return e as ZodError;
	}
	throw new Error("Expected ZodError");
}

describe("errorMiddleware", () => {
	describe("AppError", () => {
		it("returns the correct status code", () => {
			const res = mockRes();
			errorMiddleware(new AppError("Not found", 404), req, res, next);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it("returns the error message in the body", () => {
			const res = mockRes();
			errorMiddleware(new AppError("Not found", 404), req, res, next);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: "Not found" }),
			);
		});

		it("includes the optional code in the body", () => {
			const res = mockRes();
			errorMiddleware(
				new AppError("Forbidden", 403, "FORBIDDEN"),
				req,
				res,
				next,
			);
			expect(res.json).toHaveBeenCalledWith({
				error: "Forbidden",
				code: "FORBIDDEN",
			});
		});
	});

	describe("ZodError", () => {
		it("returns 422", () => {
			const res = mockRes();
			errorMiddleware(makeZodError(), req, res, next);
			expect(res.status).toHaveBeenCalledWith(422);
		});

		it("returns validation error message with field details", () => {
			const res = mockRes();
			errorMiddleware(makeZodError(), req, res, next);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Validation error",
					details: expect.any(Object),
				}),
			);
		});
	});

	describe("generic Error", () => {
		it("returns 500", () => {
			const res = mockRes();
			errorMiddleware(new Error("boom"), req, res, next);
			expect(res.status).toHaveBeenCalledWith(500);
		});

		it("returns a generic message without exposing internals", () => {
			const res = mockRes();
			errorMiddleware(new Error("sensitive internal detail"), req, res, next);
			expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
		});
	});
});
