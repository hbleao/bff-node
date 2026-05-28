import { Request, Response } from "express";
import { createUserSchema, updateUserSchema } from "../schemas/user.schemas";
import { IUserService } from "../services/interfaces/user.service.interface";

export class UserController {
	constructor(private readonly userService: IUserService) {}

	listUsers = async (_req: Request, res: Response): Promise<void> => {
		const users = await this.userService.listUsers();
		res.json(users);
	};

	getUserById = async (req: Request, res: Response): Promise<void> => {
		const user = await this.userService.getUserById(req.params.id);
		res.json(user);
	};

	createUser = async (req: Request, res: Response): Promise<void> => {
		const body = createUserSchema.parse(req.body);
		const user = await this.userService.createUser(body);
		res.status(201).json(user);
	};

	updateUser = async (req: Request, res: Response): Promise<void> => {
		const body = updateUserSchema.parse(req.body);
		const user = await this.userService.updateUser(req.params.id, body);
		res.json(user);
	};

	deleteUser = async (req: Request, res: Response): Promise<void> => {
		await this.userService.deleteUser(req.params.id);
		res.status(204).send();
	};
}
