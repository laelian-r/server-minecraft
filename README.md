1. On met ce code dans le fichier js :

`
import express from "express";
import { Rcon } from "rcon-client";

export let rcon;

export async function connectRcon() {
rcon = await Rcon.connect({
host: "localhost",
port: 25575,
password: "1234",
});
console.log("[RCON] Connected at 0.0.0.0:25575");
rcon.on("end", () => console.log("[RCON] Disconnected from 0.0.0.0:25575"));
}

connectRcon();

export const app = express().use(express.json());

app.post("/mobs", async (req, res) => {
const { type, x, y, z, CustomName, CustomNameVisible } = req.body;

    if (!type || x === undefined || y === undefined || z === undefined) {
    	return res.sendStatus(400);
    }

    let command = `summon ${type} ${x} ${y} ${z}`;
    if (CustomName || CustomNameVisible !== undefined) {
    	command += ` {CustomName:"${CustomName || ""}",CustomNameVisible:${CustomNameVisible ? "1b" : "0b"}}`;
    }

    const rconResponse = await rcon.send(command);
    res.status(201).send(rconResponse);

});

app.delete("/mobs", async (req, res) => {
const { CustomName } = req.body;

    if (CustomName === undefined) {
    	return res.sendStatus(400);
    }

    const rconResponse = await rcon.send(`/kill @e[name="${CustomName}"]`);
    res.status(200).send(rconResponse);

});

export const server = app.listen(3000, () => {
console.log("Server is running on http://localhost:3000");
});
`

2. On va faire des tests sur les methodes POST et DELETE de la route "/mobs" dans un fichier "tests/mobs.tests.js" :

`
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
`

3. Et on va ajouter ça dans le package.json :

`"scripts": {
	"start": "node index.js",
	"test":"node--test--experimental-test-module-mock"
},`

4. On lance l'API avec `node index.js`

5. On lance le serveur avec `docker compose --build`

6. On test la methode POST sur Postman :
   `{
    "type": "minecraft:zombie",
    "x": "-180",
    "y": "71",
    "z": "-119",
    "CustomName": "MIN ZOMPIE !!! 🙋",
    "CustomNameVisible": 1
}`

On peut voir sur le serveur Minecraft (localhost:25565) que le zombie à bien été ajouté

7. On test la methode DELETE sur Postman :
   `{
    "CustomName": "MIN ZOMPIE !!! 🙋"
}`

On peut voir sur le serveur Minecraft (localhost:25565) que le zombie à bien été tué
