import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import type { User } from "../../repositories/interfaces/user.repository.interface";
import type { IUserService } from "../../services/interfaces/user.service.interface";
import { UserController } from "../user.controller";

function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: "user-1",
		name: "Alice Souza",
		email: "alice@email.com",
		createdAt: new Date(),
		...overrides,
	};
}

function makeService(): IUserService {
	return {
		listUsers: vi.fn(),
		getUserById: vi.fn(),
		createUser: vi.fn(),
		updateUser: vi.fn(),
		deleteUser: vi.fn(),
	};
}

function mockReq(overrides: Partial<Request> = {}): Request {
	return { params: {}, body: {}, ...overrides } as unknown as Request;
}

function mockRes(): Response {
	const res = {
		json: vi.fn(),
		status: vi.fn(),
		send: vi.fn(),
	} as unknown as Response;
	(res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
	return res;
}

describe("UserController", () => {
	let service: IUserService;
	let controller: UserController;

	beforeEach(() => {
		service = makeService();
		controller = new UserController(service);
	});

	describe("listUsers", () => {
		it("responds with the list of users", async () => {
			const users = [makeUser()];
			vi.mocked(service.listUsers).mockResolvedValue(users);
			const res = mockRes();
			await controller.listUsers(mockReq(), res);
			expect(res.json).toHaveBeenCalledWith(users);
		});
	});

	describe("getUserById", () => {
		it("responds with the user", async () => {
			const user = makeUser();
			vi.mocked(service.getUserById).mockResolvedValue(user);
			const res = mockRes();
			await controller.getUserById(
				mockReq({ params: { id: "user-1" } as never }),
				res,
			);
			expect(service.getUserById).toHaveBeenCalledWith("user-1");
			expect(res.json).toHaveBeenCalledWith(user);
		});
	});

	describe("createUser", () => {
		it("responds with 201 and the created user for valid body", async () => {
			const user = makeUser();
			vi.mocked(service.createUser).mockResolvedValue(user);
			const res = mockRes();
			await controller.createUser(
				mockReq({ body: { name: "Alice Souza", email: "alice@email.com" } }),
				res,
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(user);
		});

		it("throws ZodError when email is missing", async () => {
			await expect(
				controller.createUser(mockReq({ body: { name: "Alice" } }), mockRes()),
			).rejects.toThrow(ZodError);
		});

		it("throws ZodError when email is invalid", async () => {
			await expect(
				controller.createUser(
					mockReq({ body: { name: "Alice", email: "not-an-email" } }),
					mockRes(),
				),
			).rejects.toThrow(ZodError);
		});

		it("throws ZodError when name is empty", async () => {
			await expect(
				controller.createUser(
					mockReq({ body: { name: "", email: "alice@email.com" } }),
					mockRes(),
				),
			).rejects.toThrow(ZodError);
		});
	});

	describe("updateUser", () => {
		it("responds with the updated user for valid body", async () => {
			const user = makeUser({ name: "Alice Atualizada" });
			vi.mocked(service.updateUser).mockResolvedValue(user);
			const res = mockRes();
			await controller.updateUser(
				mockReq({
					params: { id: "user-1" } as never,
					body: { name: "Alice Atualizada" },
				}),
				res,
			);
			expect(res.json).toHaveBeenCalledWith(user);
		});

		it("throws ZodError when email format is invalid", async () => {
			await expect(
				controller.updateUser(
					mockReq({
						params: { id: "user-1" } as never,
						body: { email: "bad-email" },
					}),
					mockRes(),
				),
			).rejects.toThrow(ZodError);
		});
	});

	describe("deleteUser", () => {
		it("responds with 204 and no body", async () => {
			vi.mocked(service.deleteUser).mockResolvedValue();
			const res = mockRes();
			await controller.deleteUser(
				mockReq({ params: { id: "user-1" } as never }),
				res,
			);
			expect(res.status).toHaveBeenCalledWith(204);
			expect(res.send).toHaveBeenCalled();
		});
	});
});
