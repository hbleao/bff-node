import { AppError } from "../errors/app-error";

export interface HttpClientConfig {
	baseUrl: string;
	defaultHeaders?: Record<string, string>;
	timeoutMs?: number;
}

export class HttpClient {
	private readonly baseUrl: string;
	private readonly defaultHeaders: Record<string, string>;
	private readonly timeoutMs: number;

	constructor(config: HttpClientConfig) {
		this.baseUrl = config.baseUrl.replace(/\/$/, "");
		this.defaultHeaders = config.defaultHeaders ?? {};
		this.timeoutMs = config.timeoutMs ?? 10_000;
	}

	async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
		return this.request<T>("GET", path, undefined, headers);
	}

	async post<T>(
		path: string,
		body?: unknown,
		headers?: Record<string, string>,
	): Promise<T> {
		return this.request<T>("POST", path, body, headers);
	}

	async patch<T>(
		path: string,
		body?: unknown,
		headers?: Record<string, string>,
	): Promise<T> {
		return this.request<T>("PATCH", path, body, headers);
	}

	async delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
		return this.request<T>("DELETE", path, undefined, headers);
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		headers?: Record<string, string>,
	): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers: {
					"Content-Type": "application/json",
					...this.defaultHeaders,
					...headers,
				},
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (!response.ok) {
				const errorBody = await response.text().catch(() => "");
				throw new AppError(
					`Upstream error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`,
					response.status >= 500 ? 502 : response.status,
					"UPSTREAM_ERROR",
				);
			}

			if (response.status === 204) return undefined as T;

			return response.json() as Promise<T>;
		} catch (err) {
			if (err instanceof AppError) throw err;
			if ((err as Error).name === "AbortError") {
				throw new AppError(
					"Upstream request timed out",
					504,
					"UPSTREAM_TIMEOUT",
				);
			}
			throw new AppError(
				`Upstream request failed: ${(err as Error).message}`,
				502,
				"UPSTREAM_UNAVAILABLE",
			);
		} finally {
			clearTimeout(timeout);
		}
	}
}
