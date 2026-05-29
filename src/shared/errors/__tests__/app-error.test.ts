import { describe, expect, it } from "vitest";
import { AppError } from "../app-error";

describe("AppError", () => {
	it("is an instance of Error", () => {
		const err = new AppError("something failed", 400, "BAD_REQUEST");
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("something failed");
		expect(err.statusCode).toBe(400);
		expect(err.code).toBe("BAD_REQUEST");
		expect(err.name).toBe("AppError");
	});

	it("defaults to statusCode 500 when not provided", () => {
		const err = new AppError("oops");
		expect(err.statusCode).toBe(500);
		expect(err.code).toBeUndefined();
	});

	describe("factory methods", () => {
		it.each([
			["badRequest", 400],
			["notFound", 404],
			["unauthorized", 401],
			["unprocessable", 422],
			["internal", 500],
		] as const)("%s() returns statusCode %d", (method, expectedStatus) => {
			const err = AppError[method]("test message", "TEST_CODE");
			expect(err).toBeInstanceOf(AppError);
			expect(err.statusCode).toBe(expectedStatus);
			expect(err.message).toBe("test message");
			expect(err.code).toBe("TEST_CODE");
		});
	});
});
