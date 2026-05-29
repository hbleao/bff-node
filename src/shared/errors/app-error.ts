export class AppError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number = 500,
		public readonly code?: string,
	) {
		super(message);
		this.name = "AppError";
		Error.captureStackTrace(this, this.constructor);
	}

	static badRequest(message: string, code?: string) {
		return new AppError(message, 400, code);
	}

	static notFound(message: string, code?: string) {
		return new AppError(message, 404, code);
	}

	static unauthorized(message: string, code?: string) {
		return new AppError(message, 401, code);
	}

	static unprocessable(message: string, code?: string) {
		return new AppError(message, 422, code);
	}

	static internal(message: string, code?: string) {
		return new AppError(message, 500, code);
	}
}
