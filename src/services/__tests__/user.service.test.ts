import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import type {
	IUserRepository,
	User,
} from "../../repositories/interfaces/user.repository.interface";
import { UserService } from "../user.service";

function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: "user-1",
		name: "Alice Souza",
		email: "alice@email.com",
		createdAt: new Date(),
		...overrides,
	};
}

function makeRepo(): IUserRepository {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	};
}

describe("UserService", () => {
	let repo: IUserRepository;
	let service: UserService;

	beforeEach(() => {
		repo = makeRepo();
		service = new UserService(repo);
	});

	describe("listUsers", () => {
		it("returns all users from the repository", async () => {
			const users = [makeUser()];
			vi.mocked(repo.findAll).mockResolvedValue(users);
			await expect(service.listUsers()).resolves.toEqual(users);
		});
	});

	describe("getUserById", () => {
		it("returns the user when found", async () => {
			const user = makeUser();
			vi.mocked(repo.findById).mockResolvedValue(user);
			await expect(service.getUserById("user-1")).resolves.toEqual(user);
		});

		it("throws AppError 404 when user is not found", async () => {
			vi.mocked(repo.findById).mockResolvedValue(null);
			await expect(service.getUserById("missing")).rejects.toThrow(
				new AppError("User not found", 404),
			);
		});
	});

	describe("createUser", () => {
		it("calls repository create with the provided data", async () => {
			const user = makeUser();
			vi.mocked(repo.create).mockResolvedValue(user);
			await service.createUser({
				name: "Alice Souza",
				email: "alice@email.com",
			});
			expect(repo.create).toHaveBeenCalledWith({
				name: "Alice Souza",
				email: "alice@email.com",
			});
		});

		it("returns the created user", async () => {
			const user = makeUser();
			vi.mocked(repo.create).mockResolvedValue(user);
			await expect(
				service.createUser({ name: "Alice Souza", email: "alice@email.com" }),
			).resolves.toEqual(user);
		});
	});

	describe("updateUser", () => {
		it("returns the updated user", async () => {
			const user = makeUser({ name: "Alice Atualizada" });
			vi.mocked(repo.update).mockResolvedValue(user);
			await expect(
				service.updateUser("user-1", { name: "Alice Atualizada" }),
			).resolves.toEqual(user);
		});

		it("throws AppError 404 when user is not found", async () => {
			vi.mocked(repo.update).mockResolvedValue(null);
			await expect(
				service.updateUser("missing", { name: "X" }),
			).rejects.toThrow(new AppError("User not found", 404));
		});
	});

	describe("deleteUser", () => {
		it("resolves without value when user is deleted", async () => {
			vi.mocked(repo.delete).mockResolvedValue(true);
			await expect(service.deleteUser("user-1")).resolves.toBeUndefined();
		});

		it("throws AppError 404 when user is not found", async () => {
			vi.mocked(repo.delete).mockResolvedValue(false);
			await expect(service.deleteUser("missing")).rejects.toThrow(
				new AppError("User not found", 404),
			);
		});
	});
});
