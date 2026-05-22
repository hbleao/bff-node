import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
	LOG_DIR: z.string().default("logs"),
	MULESOFT_ORIGIN: z.string().default("http://localhost:3000"),
	EXTERNAL_API_URL: z.string().url().optional(),
	EXTERNAL_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error(
		"Invalid environment variables:",
		parsed.error.flatten().fieldErrors,
	);
	process.exit(1);
}

export const env = parsed.data;
