import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app";

// IDs fixos do seed em user.repository.ts
const ALICE_ID = "a1b2c3d4-0001-0001-0001-000000000001";
const BRUNO_ID = "a1b2c3d4-0002-0002-0002-000000000002";
const CARLA_ID = "a1b2c3d4-0003-0003-0003-000000000003";

describe("GET /health", () => {
	it("returns status ok", async () => {
		const res = await request(app).get("/health");
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ status: "ok" });
	});
});

describe("User routes", () => {
	// Os testes deste bloco compartilham a mesma instância do repositório
	// e são executados sequencialmente pelo Vitest.

	describe("GET /api/v1/users", () => {
		it("returns the 3 seeded users", async () => {
			const res = await request(app).get("/api/v1/users");
			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(3);
		});

		it("returns users with the expected shape", async () => {
			const res = await request(app).get("/api/v1/users");
			expect(res.body[0]).toMatchObject({
				id: expect.any(String),
				name: expect.any(String),
				email: expect.any(String),
				createdAt: expect.any(String),
			});
		});
	});

	describe("GET /api/v1/users/:id", () => {
		it("returns the correct user", async () => {
			const res = await request(app).get(`/api/v1/users/${ALICE_ID}`);
			expect(res.status).toBe(200);
			expect(res.body).toMatchObject({ id: ALICE_ID, name: "Alice Souza" });
		});

		it("returns 404 for an unknown id", async () => {
			const res = await request(app).get("/api/v1/users/non-existent-id");
			expect(res.status).toBe(404);
			expect(res.body).toMatchObject({ error: "User not found" });
		});
	});

	describe("POST /api/v1/users", () => {
		it("creates a new user and returns 201", async () => {
			const res = await request(app)
				.post("/api/v1/users")
				.send({ name: "Daniel Costa", email: "daniel@email.com" });
			expect(res.status).toBe(201);
			expect(res.body).toMatchObject({
				name: "Daniel Costa",
				email: "daniel@email.com",
			});
			expect(res.body.id).toBeDefined();
		});

		it("returns 422 when email is missing", async () => {
			const res = await request(app)
				.post("/api/v1/users")
				.send({ name: "Sem Email" });
			expect(res.status).toBe(422);
		});

		it("returns 422 when email is invalid", async () => {
			const res = await request(app)
				.post("/api/v1/users")
				.send({ name: "Test", email: "not-an-email" });
			expect(res.status).toBe(422);
		});

		it("returns 422 when name is empty", async () => {
			const res = await request(app)
				.post("/api/v1/users")
				.send({ name: "", email: "test@email.com" });
			expect(res.status).toBe(422);
		});
	});

	describe("PATCH /api/v1/users/:id", () => {
		it("updates the user name", async () => {
			const res = await request(app)
				.patch(`/api/v1/users/${BRUNO_ID}`)
				.send({ name: "Bruno Atualizado" });
			expect(res.status).toBe(200);
			expect(res.body.name).toBe("Bruno Atualizado");
		});

		it("allows updating only the email", async () => {
			const res = await request(app)
				.patch(`/api/v1/users/${ALICE_ID}`)
				.send({ email: "alice.novo@email.com" });
			expect(res.status).toBe(200);
			expect(res.body.email).toBe("alice.novo@email.com");
		});

		it("returns 404 for an unknown id", async () => {
			const res = await request(app)
				.patch("/api/v1/users/non-existent")
				.send({ name: "X" });
			expect(res.status).toBe(404);
		});

		it("returns 422 for an invalid email", async () => {
			const res = await request(app)
				.patch(`/api/v1/users/${ALICE_ID}`)
				.send({ email: "bad-email" });
			expect(res.status).toBe(422);
		});
	});

	describe("DELETE /api/v1/users/:id", () => {
		it("deletes the user and returns 204", async () => {
			const res = await request(app).delete(`/api/v1/users/${CARLA_ID}`);
			expect(res.status).toBe(204);
		});

		it("returns 404 when trying to delete an already deleted user", async () => {
			const res = await request(app).delete(`/api/v1/users/${CARLA_ID}`);
			expect(res.status).toBe(404);
		});

		it("returns 404 for an unknown id", async () => {
			const res = await request(app).delete("/api/v1/users/non-existent");
			expect(res.status).toBe(404);
		});
	});
});
