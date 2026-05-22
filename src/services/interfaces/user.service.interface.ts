import type { User } from "../../repositories/interfaces/user.repository.interface";

export interface CreateUserDTO {
	name: string;
	email: string;
}

export interface UpdateUserDTO {
	name?: string;
	email?: string;
}

export interface IUserService {
	listUsers(): Promise<User[]>;
	getUserById(id: string): Promise<User>;
	createUser(data: CreateUserDTO): Promise<User>;
	updateUser(id: string, data: UpdateUserDTO): Promise<User>;
	deleteUser(id: string): Promise<void>;
}
