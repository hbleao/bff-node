import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "./env";

const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
		return `[${timestamp}] ${level}: ${message}${metaStr}`;
	}),
);

const jsonFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json(),
);

export const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	transports: [
		new winston.transports.Console({
			format: env.NODE_ENV === "production" ? jsonFormat : consoleFormat,
		}),
		new DailyRotateFile({
			filename: "logs/app-%DATE%.log",
			datePattern: "YYYY-MM-DD",
			maxFiles: "14d",
			format: jsonFormat,
		}),
	],
});
