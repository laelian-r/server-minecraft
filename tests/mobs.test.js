import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app, server, connectRcon, rcon } from "../index.js";

describe("TEST /mobs", () => {
	before(async () => {
		await connectRcon(); // attend que rcon soit prêt avant les tests
	});

	after(() => {
		server.close();
		rcon.end();
	});

	it("test POST /mobs", async () => {
		const response = await request(app)
			.post("/mobs")
			.send({
				type: "minecraft:zombie",
				x: "-180",
				y: "71",
				z: "-119",
				CustomName: "MIN ZOMPIE !!! 🙋",
				CustomNameVisible: 1,
			})
			.set("Content-Type", "application/json")
			.expect(201);

		assert.strictEqual(response.text, "Summoned new MIN ZOMPIE !!! 🙋");
	});

	it("test DELETE /mobs", async () => {
		const response = await request(app)
			.delete("/mobs")
			.send({ CustomName: "MIN ZOMPIE !!! 🙋" })
			.set("Content-Type", "application/json")
			.expect(200);

		assert.strictEqual(response.text, "Killed MIN ZOMPIE !!! 🙋");
	});
});
