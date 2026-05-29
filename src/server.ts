import { createApp } from "./app";
import { env, logger } from "./config";
import { buildContainer } from "./container";

const routers = buildContainer();
const app = createApp(routers);

const server = app.listen(env.PORT, () => {
	logger.info(`Server running on port ${env.PORT}`, { env: env.NODE_ENV });
});

process.on("SIGTERM", () => {
	logger.info("SIGTERM received — shutting down gracefully");
	server.close(() => {
		logger.info("Server closed");
		process.exit(0);
	});
});
