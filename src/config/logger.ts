import path from "node:path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "./env";
import { requestContext } from "./request-context";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Injects requestId from AsyncLocalStorage into every log entry
const requestIdFormat = winston.format((info) => {
	const requestId = requestContext.getRequestId();
	if (requestId) info.requestId = requestId;
	return info;
});

// Serializes error.cause chains that Winston's built-in errors() format drops
type ErrorWithCause = Error & { cause?: unknown };

function serializeErrorChain(err: unknown): unknown {
	if (!(err instanceof Error)) return err;
	return {
		message: err.message,
		name: err.name,
		...((err as ErrorWithCause).cause !== undefined && {
			cause: serializeErrorChain((err as ErrorWithCause).cause),
		}),
	};
}

const errorCauseFormat = winston.format((info) => {
	const splat = (info[Symbol.for("splat")] as unknown[]) ?? [];
	const err =
		splat.find((a): a is Error => a instanceof Error) ??
		(info.message instanceof Error ? info.message : null);
	const cause = (err as ErrorWithCause | null)?.cause;
	if (cause !== undefined) info.errorCause = serializeErrorChain(cause);
	return info;
});

const consoleFormat = combine(
	requestIdFormat(),
	errors({ stack: true }),
	colorize(),
	timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
		const id = requestId ? ` [${String(requestId).slice(0, 8)}]` : "";
		const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
		return `${timestamp}${id} [${level}]: ${stack ?? message}${metaStr}`;
	}),
);

const fileFormat = combine(
	requestIdFormat(),
	errors({ stack: true }),
	errorCauseFormat(),
	timestamp(),
	json(),
);

const transports: winston.transport[] = [
	new winston.transports.Console({ format: consoleFormat }),
];

if (env.NODE_ENV === "production") {
	transports.push(
		new DailyRotateFile({
			filename: path.join(env.LOG_DIR, "error-%DATE%.log"),
			datePattern: "YYYY-MM-DD",
			level: "error",
			maxSize: "20m",
			maxFiles: "14d",
			zippedArchive: true,
			format: fileFormat,
		}),
		new DailyRotateFile({
			filename: path.join(env.LOG_DIR, "combined-%DATE%.log"),
			datePattern: "YYYY-MM-DD",
			maxSize: "50m",
			maxFiles: "14d",
			zippedArchive: true,
			format: fileFormat,
		}),
	);
}

export const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	transports,
	exceptionHandlers: [
		new winston.transports.Console({ format: consoleFormat }),
	],
});
