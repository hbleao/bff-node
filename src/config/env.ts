import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
	MCP_BASE_URL: z.url(),
	MCP_API_KEY: z.string().min(1),
	NOTIFICATIONS_BASE_URL: z.url(),
	NOTIFICATIONS_API_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error(
		"Invalid environment variables:",
		z.flattenError(parsed.error).fieldErrors,
	);
	process.exit(1);
}

export const env = parsed.data;
export type Env = typeof parsed.data;
