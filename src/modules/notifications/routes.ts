import { Router } from "express";
import type { NotificationsController } from "./controller";

export function createNotificationsRouter(
	controller: NotificationsController,
): Router {
	const router = Router();

	router.get("/:userId", (req, res, next) =>
		controller.listByUser(req, res).catch(next),
	);

	router.post("/", (req, res, next) => controller.send(req, res).catch(next));

	router.patch("/:notificationId/read", (req, res, next) =>
		controller.markAsRead(req, res).catch(next),
	);

	return router;
}
