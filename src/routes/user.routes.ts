import { type IRouter, Router } from "express";
import type { Container } from "../container";

export function createUserRouter(container: Container): IRouter {
	const router: IRouter = Router();
	const { userController } = container;

	router.get("/", userController.listUsers);
	router.get("/:id", userController.getUserById);
	router.post("/", userController.createUser);
	router.patch("/:id", userController.updateUser);
	router.delete("/:id", userController.deleteUser);

	return router;
}
