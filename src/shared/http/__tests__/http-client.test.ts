import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import { HttpClient } from "../http-client";

function makeResponse(status: number, body?: unknown): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: String(status),
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(body ? JSON.stringify(body) : ""),
	} as unknown as Response;
}

describe("HttpClient", () => {
	let client: HttpClient;
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
		client = new HttpClient({
			baseUrl: "https://api.example.com",
			defaultHeaders: { "x-api-key": "secret" },
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET", () => {
		it("returns parsed JSON on success", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(200, { id: "1" }));

			const result = await client.get<{ id: string }>("/resource/1");

			expect(result).toEqual({ id: "1" });
			expect(fetchMock).toHaveBeenCalledWith(
				"https://api.example.com/resource/1",
				expect.objectContaining({ method: "GET" }),
			);
		});

		it("merges default headers with per-request headers", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(200, {}));

			await client.get("/resource", { "x-trace-id": "abc" });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						"x-api-key": "secret",
						"x-trace-id": "abc",
					}),
				}),
			);
		});
	});

	describe("POST", () => {
		it("sends JSON body and returns parsed response", async () => {
			const payload = { userId: "u1", eventType: "click" };
			fetchMock.mockResolvedValueOnce(makeResponse(201, { id: "evt-1" }));

			const result = await client.post<{ id: string }>("/events", payload);

			expect(result).toEqual({ id: "evt-1" });
			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(payload),
				}),
			);
		});
	});

	describe("PATCH", () => {
		it("sends PATCH request with body", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(200, { updated: true }));

			await client.patch("/resource/1", { read: true });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ method: "PATCH" }),
			);
		});
	});

	describe("error handling", () => {
		it("returns undefined for 204 No Content", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(204));

			const result = await client.get("/resource");

			expect(result).toBeUndefined();
		});

		it("throws AppError with original status for 4xx responses", async () => {
			fetchMock.mockResolvedValueOnce(
				makeResponse(404, { error: "not found" }),
			);

			await expect(client.get("/resource")).rejects.toMatchObject({
				statusCode: 404,
				code: "UPSTREAM_ERROR",
			});
		});

		it("throws AppError with 502 for 5xx upstream responses", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(503, "service unavailable"));

			await expect(client.get("/resource")).rejects.toMatchObject({
				statusCode: 502,
				code: "UPSTREAM_ERROR",
			});
		});

		it("throws AppError with 504 on timeout (AbortError)", async () => {
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";
			fetchMock.mockRejectedValueOnce(abortError);

			await expect(client.get("/resource")).rejects.toMatchObject({
				statusCode: 504,
				code: "UPSTREAM_TIMEOUT",
			});
		});

		it("throws AppError with 502 on network failure", async () => {
			fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

			await expect(client.get("/resource")).rejects.toMatchObject({
				statusCode: 502,
				code: "UPSTREAM_UNAVAILABLE",
			});
		});

		it("rethrows AppError directly without wrapping", async () => {
			const originalError = AppError.badRequest("bad request from test");
			fetchMock.mockRejectedValueOnce(originalError);

			await expect(client.get("/resource")).rejects.toBe(originalError);
		});
	});
});
