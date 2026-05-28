import { type IRouter, Router } from "express";
import type { Container } from "../container";
import { createPersonalizationRouter } from "./personalization.routes";
import { createUserRouter } from "./user.routes";

export function createRouter(container: Container): IRouter {
	const router: IRouter = Router();

	router.use("/users", createUserRouter(container));
	router.use("/personalization", createPersonalizationRouter(container));

	return router;
}
