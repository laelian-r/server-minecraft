import express from "express";
import { Rcon } from "rcon-client";

export let rcon;

export async function connectRcon() {
	try {
		rcon = await Rcon.connect({
			host: "localhost",
			port: 25575,
			password: "1234",
		});
		console.log("[RCON] Connected at 0.0.0.0:25575");
		rcon.on("end", () => console.log("[RCON] Disconnected from 0.0.0.0:25575"));
	} catch (err) {
		console.error(err);
	}
}

connectRcon();

export const app = express().use(express.json());

app.get("/", (req, res) => {
	res.sendStatus(200);
});

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

export const server = app.listen(3000, "0.0.0.0", () => {
	console.log("Server is running on http://localhost:3000");
});
