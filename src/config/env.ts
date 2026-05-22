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
	// BCP API
	BCP_BASE_URL: z.string().url().optional(),
	BCP_API_KEY: z.string().optional(),
	// Salesforce Personalization
	SF_PERSONALIZATION_BASE_URL: z.string().url().optional(),
	SF_PERSONALIZATION_DATASET_ID: z.string().optional(),
	SF_PERSONALIZATION_CLIENT_ID: z.string().optional(),
	SF_PERSONALIZATION_CLIENT_SECRET: z.string().optional(),
	SF_PERSONALIZATION_TOKEN_URL: z
		.string()
		.url()
		.default("https://login.salesforce.com/services/oauth2/token"),
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
