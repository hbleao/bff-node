import { Request, Response } from "express";
import { z } from "zod";
import { IUserService } from "../services/interfaces/user.service.interface";

const createUserSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
});

const updateUserSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	email: z.string().email().optional(),
});

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
