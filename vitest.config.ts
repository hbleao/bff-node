import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		exclude: ["dist/**", "node_modules/**"],
		env: {
			NODE_ENV: "test",
			MCP_BASE_URL: "https://mcp.example.com",
			MCP_API_KEY: "test-mcp-key",
			NOTIFICATIONS_BASE_URL: "https://notifications.example.com",
			NOTIFICATIONS_API_KEY: "test-notifications-key",
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/**/*.ts"],
			exclude: ["src/server.ts", "src/**/__tests__/**"],
		},
	},
});
