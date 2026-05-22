import { beforeEach, describe, expect, it } from "vitest";
import { UserRepository } from "../user.repository";

const ALICE_ID = "a1b2c3d4-0001-0001-0001-000000000001";
const BRUNO_ID = "a1b2c3d4-0002-0002-0002-000000000002";

describe("UserRepository", () => {
	let repo: UserRepository;

	beforeEach(() => {
		repo = new UserRepository();
	});

	describe("findAll", () => {
		it("returns all seeded users", async () => {
			const users = await repo.findAll();
			expect(users).toHaveLength(3);
		});
	});

	describe("findById", () => {
		it("returns the user when found", async () => {
			const user = await repo.findById(ALICE_ID);
			expect(user).not.toBeNull();
			expect(user?.name).toBe("Alice Souza");
			expect(user?.email).toBe("alice.souza@email.com");
		});

		it("returns null for unknown id", async () => {
			expect(await repo.findById("non-existent")).toBeNull();
		});
	});

	describe("create", () => {
		it("creates a user with a generated id and createdAt", async () => {
			const user = await repo.create({
				name: "Test User",
				email: "test@email.com",
			});
			expect(user.id).toBeDefined();
			expect(user.createdAt).toBeInstanceOf(Date);
			expect(user.name).toBe("Test User");
		});

		it("persists the new user in the list", async () => {
			await repo.create({ name: "Test User", email: "test@email.com" });
			expect(await repo.findAll()).toHaveLength(4);
		});

		it("each created user gets a unique id", async () => {
			const a = await repo.create({ name: "A", email: "a@email.com" });
			const b = await repo.create({ name: "B", email: "b@email.com" });
			expect(a.id).not.toBe(b.id);
		});
	});

	describe("update", () => {
		it("updates the user fields and returns it", async () => {
			const user = await repo.update(ALICE_ID, { name: "Alice Atualizada" });
			expect(user?.name).toBe("Alice Atualizada");
			expect(user?.id).toBe(ALICE_ID);
		});

		it("does not change fields that were not passed", async () => {
			const user = await repo.update(ALICE_ID, { name: "Alice Atualizada" });
			expect(user?.email).toBe("alice.souza@email.com");
		});

		it("returns null for unknown id", async () => {
			expect(await repo.update("non-existent", { name: "X" })).toBeNull();
		});
	});

	describe("delete", () => {
		it("removes the user and returns true", async () => {
			const result = await repo.delete(BRUNO_ID);
			expect(result).toBe(true);
			expect(await repo.findById(BRUNO_ID)).toBeNull();
		});

		it("reduces the total user count by one", async () => {
			await repo.delete(BRUNO_ID);
			expect(await repo.findAll()).toHaveLength(2);
		});

		it("returns false for unknown id", async () => {
			expect(await repo.delete("non-existent")).toBe(false);
		});
	});
});
