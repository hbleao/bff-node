import path from "node:path";
import winston from "winston";
import { env } from "./env";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = combine(
	colorize(),
	timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	errors({ stack: true }),
	printf(({ level, message, timestamp, stack, ...meta }) => {
		const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
		return `${timestamp} [${level}]: ${stack ?? message}${metaStr}`;
	}),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports: winston.transport[] = [new winston.transports.Console()];

if (env.NODE_ENV === "production") {
	transports.push(
		new winston.transports.File({
			filename: path.join(env.LOG_DIR, "error.log"),
			level: "error",
		}),
		new winston.transports.File({
			filename: path.join(env.LOG_DIR, "combined.log"),
		}),
	);
}

export const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	format: env.NODE_ENV === "production" ? prodFormat : devFormat,
	transports,
	exceptionHandlers: [new winston.transports.Console()],
});
