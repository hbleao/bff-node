import { logger } from "../config/logger";
import { AppError } from "../errors/app-error";
import type {
	IUserRepository,
	User,
} from "../repositories/interfaces/user.repository.interface";
import type {
	CreateUserDTO,
	IUserService,
	UpdateUserDTO,
} from "./interfaces/user.service.interface";

export class UserService implements IUserService {
	constructor(private readonly userRepository: IUserRepository) {}

	async listUsers(): Promise<User[]> {
		logger.info("Listing all users");
		return this.userRepository.findAll();
	}

	async getUserById(id: string): Promise<User> {
		const user = await this.userRepository.findById(id);
		if (!user) throw new AppError("User not found", 404);
		return user;
	}

	async createUser(data: CreateUserDTO): Promise<User> {
		logger.info({ msg: "Creating user", email: data.email });
		return this.userRepository.create(data);
	}

	async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
		const user = await this.userRepository.update(id, data);
		if (!user) throw new AppError("User not found", 404);
		return user;
	}

	async deleteUser(id: string): Promise<void> {
		const deleted = await this.userRepository.delete(id);
		if (!deleted) throw new AppError("User not found", 404);
		logger.info({ msg: "User deleted", id });
	}
}
