import { IRouter, Router } from "express";
import { userRoutes } from "./user.routes";

const router: IRouter = Router();

router.use("/users", userRoutes);

export { router };
