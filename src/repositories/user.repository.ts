import { randomUUID } from "node:crypto";
import { IUserRepository, User } from "./interfaces/user.repository.interface";

// In-memory implementation — replace with your database client (Prisma, Drizzle, etc.)
export class UserRepository implements IUserRepository {
	private users: User[] = [
		{
			id: "a1b2c3d4-0001-0001-0001-000000000001",
			name: "Alice Souza",
			email: "alice.souza@email.com",
			createdAt: new Date("2024-01-10T09:00:00Z"),
		},
		{
			id: "a1b2c3d4-0002-0002-0002-000000000002",
			name: "Bruno Lima",
			email: "bruno.lima@email.com",
			createdAt: new Date("2024-02-15T14:30:00Z"),
		},
		{
			id: "a1b2c3d4-0003-0003-0003-000000000003",
			name: "Carla Mendes",
			email: "carla.mendes@email.com",
			createdAt: new Date("2024-03-22T11:15:00Z"),
		},
	];

	async findAll(): Promise<User[]> {
		return this.users;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find((u) => u.id === id) ?? null;
	}

	async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
		const user: User = { ...data, id: randomUUID(), createdAt: new Date() };
		this.users.push(user);
		return user;
	}

	async update(
		id: string,
		data: Partial<Omit<User, "id" | "createdAt">>,
	): Promise<User | null> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) return null;
		this.users[index] = { ...this.users[index], ...data };
		return this.users[index];
	}

	async delete(id: string): Promise<boolean> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) return false;
		this.users.splice(index, 1);
		return true;
	}
}
