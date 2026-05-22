import { IRouter, Router } from "express";
import { personalizationRoutes } from "./personalization.routes";
import { userRoutes } from "./user.routes";

const router: IRouter = Router();

router.use("/users", userRoutes);
router.use("/personalization", personalizationRoutes);

export { router };
