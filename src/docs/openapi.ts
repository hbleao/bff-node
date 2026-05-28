import {
	extendZodWithOpenApi,
	OpenAPIRegistry,
	OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Schemas ────────────────────────────────────────────────────────────────

const UserSchema = registry.register(
	"User",
	z.object({
		id: z.uuid().openapi({ example: "a1b2c3d4-0001-0001-0001-000000000001" }),
		name: z.string().openapi({ example: "Alice Souza" }),
		email: z.string().email().openapi({ example: "alice.souza@email.com" }),
		createdAt: z.date().openapi({ example: "2024-01-10T09:00:00.000Z" }),
	}),
);

const CreateUserBody = z.object({
	name: z.string().min(1).max(100).openapi({ example: "Alice Souza" }),
	email: z.email().openapi({ example: "alice.souza@email.com" }),
});

const UpdateUserBody = z.object({
	name: z
		.string()
		.min(1)
		.max(100)
		.optional()
		.openapi({ example: "Alice Souza" }),
	email: z.email().optional().openapi({ example: "alice.souza@email.com" }),
});

const TrackEventBody = z.object({
	userId: z.string().min(1).openapi({ example: "user-123" }),
	action: z.string().min(1).openapi({
		example: "ViewItem",
		description:
			"Personalization action name (e.g. ViewItem, AddToCart, Purchase)",
	}),
	itemId: z.string().min(1).optional().openapi({ example: "product-456" }),
});

const ErrorResponse = registry.register(
	"ErrorResponse",
	z.object({
		error: z.string().openapi({ example: "User not found" }),
		code: z.string().optional().openapi({ example: "NOT_FOUND" }),
	}),
);

const ValidationErrorResponse = registry.register(
	"ValidationErrorResponse",
	z.object({
		error: z.string().openapi({ example: "Validation error" }),
		details: z.record(z.string(), z.array(z.string())).openapi({
			example: { email: ["Invalid email"] },
		}),
	}),
);

// ─── Shared responses ───────────────────────────────────────────────────────

const notFound = {
	404: {
		description: "Not found",
		content: { "application/json": { schema: ErrorResponse } },
	},
};

const unprocessable = {
	422: {
		description: "Validation error",
		content: { "application/json": { schema: ValidationErrorResponse } },
	},
};

const badGateway = {
	502: {
		description: "Upstream API error (BCP or Salesforce)",
		content: { "application/json": { schema: ErrorResponse } },
	},
};

// ─── Users ──────────────────────────────────────────────────────────────────

registry.registerPath({
	method: "get",
	path: "/users",
	tags: ["Users"],
	summary: "List all users",
	responses: {
		200: {
			description: "OK",
			content: { "application/json": { schema: z.array(UserSchema) } },
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/users/{id}",
	tags: ["Users"],
	summary: "Get user by ID",
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		200: {
			description: "OK",
			content: { "application/json": { schema: UserSchema } },
		},
		...notFound,
	},
});

registry.registerPath({
	method: "post",
	path: "/users",
	tags: ["Users"],
	summary: "Create user",
	request: {
		body: { content: { "application/json": { schema: CreateUserBody } } },
	},
	responses: {
		201: {
			description: "Created",
			content: { "application/json": { schema: UserSchema } },
		},
		...unprocessable,
	},
});

registry.registerPath({
	method: "patch",
	path: "/users/{id}",
	tags: ["Users"],
	summary: "Update user",
	request: {
		params: z.object({ id: z.string().uuid() }),
		body: { content: { "application/json": { schema: UpdateUserBody } } },
	},
	responses: {
		200: {
			description: "OK",
			content: { "application/json": { schema: UserSchema } },
		},
		...notFound,
		...unprocessable,
	},
});

registry.registerPath({
	method: "delete",
	path: "/users/{id}",
	tags: ["Users"],
	summary: "Delete user",
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
	responses: {
		204: { description: "No content" },
		...notFound,
	},
});

// ─── Personalization ─────────────────────────────────────────────────────────

registry.registerPath({
	method: "post",
	path: "/personalization/events",
	tags: ["Personalization"],
	summary: "Track user behavior event",
	description:
		"Fetches enriched data from BCP and forwards the event to Salesforce Personalization.",
	request: {
		body: { content: { "application/json": { schema: TrackEventBody } } },
	},
	responses: {
		204: { description: "Event tracked successfully" },
		...notFound,
		...unprocessable,
		...badGateway,
	},
});

// ─── Generate ────────────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV31(registry.definitions);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiDocument: Record<string, any> = generator.generateDocument({
	openapi: "3.1.0",
	info: {
		title: "BFF API",
		version: "1.0.0",
		description:
			"Backend for Frontend — aggregation layer between MuleSoft and downstream services.",
	},
	servers: [{ url: "/api/v1" }],
});
