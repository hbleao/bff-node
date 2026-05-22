export interface User {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
}

export interface IUserRepository {
	findAll(): Promise<User[]>;
	findById(id: string): Promise<User | null>;
	create(data: Omit<User, "id" | "createdAt">): Promise<User>;
	update(
		id: string,
		data: Partial<Omit<User, "id" | "createdAt">>,
	): Promise<User | null>;
	delete(id: string): Promise<boolean>;
}
