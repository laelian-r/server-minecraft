# 📖 Tutoriel — Minecraft Mob API

## Sommaire

0. [Installer les dépendances npm](#0-installer-les-dépendances-npm)
1. [Créer le serveur](#1-créer-le-serveur)
2. [Ajouter un mob](#2-ajouter-un-mob)
3. [Supprimer un mob](#3-supprimer-un-mob)
4. [Tester avec Postman](#4-tester-avec-postman)
5. [Tests automatisés](#5-tests-automatisés)

---

## 0. Installer les dépendances npm

Ce projet utilise deux packages essentiels qu'il faut installer avant de démarrer.

### `rcon-client`

Permet à l'API de communiquer avec le serveur Minecraft via le protocole RCON (Remote Console). Sans lui, impossible d'envoyer des commandes comme `summon` ou `kill` au serveur.

```bash
npm install rcon-client
```

Utilisation dans `index.js` :

```js
import { Rcon } from "rcon-client";

const rcon = await Rcon.connect({
	host: "localhost",
	port: 25575,
	password: "1234",
});
```

### `supertest`

Permet de tester les routes Express sans démarrer de vrai serveur HTTP. Il simule les requêtes directement sur l'objet `app`.

```bash
npm install supertest
```

Utilisation dans les tests :

```js
import request from "supertest";
import { app } from "../index.js";

const response = await request(app).post("/mobs").send({ ... });
```

### Tout installer en une seule commande

```bash
npm install
```

> `npm install` suffit si `package.json` est déjà configuré — il installe automatiquement `express`, `rcon-client` et `supertest`.

---

## 1. Créer le serveur

### Étape 1 — Installer les dépendances

Clone le repo et installe les packages Node.js :

```bash
git clone https://github.com/laelian-r/server-minecraft.git
cd server-minecraft
npm install
```

### Étape 2 — Lancer le serveur Minecraft avec Docker

Cette commande démarre un serveur Minecraft avec RCON activé sur le port `25575` :

```bash
docker compose up --build
```

> Le serveur Minecraft tourne sur `localhost:25565`

### Étape 3 — Lancer l'API Node.js

Dans un **autre terminal**, démarre l'API Express :

```bash
npm start
```

> Résultat attendu :
>
> ```
> Server is running on http://localhost:3000
> [RCON] Connected at 0.0.0.0:25575
> ```

---

## 2. Ajouter un mob

### Étape 1 — Requête `POST /mobs`

Envoie une requête avec le type du mob, ses coordonnées et un nom optionnel :

```
POST http://localhost:3000/mobs
Content-Type: application/json
```

```json
{
	"type": "minecraft:zombie",
	"x": "-180",
	"y": "71",
	"z": "-119",
	"CustomName": "MIN ZOMPIE !!! 🙋",
	"CustomNameVisible": 1
}
```

### Étape 2 — Commande RCON générée

L'API construit et envoie cette commande au serveur Minecraft via RCON :

```
summon minecraft:zombie -180 71 -119 {CustomName:"MIN ZOMPIE !!! 🙋",CustomNameVisible:1b}
```

### Étape 3 — Réponse attendue

```
Status 201 — "Summoned new MIN ZOMPIE !!! 🙋"
```

Le zombie apparaît en jeu aux coordonnées données, avec son nom flottant au-dessus de sa tête.

---

## 3. Supprimer un mob

### Étape 1 — Requête `DELETE /mobs`

Envoie uniquement le nom du mob à supprimer :

```
DELETE http://localhost:3000/mobs
Content-Type: application/json
```

```json
{
	"CustomName": "MIN ZOMPIE !!! 🙋"
}
```

### Étape 2 — Commande RCON générée

L'API cible toutes les entités portant ce nom exact :

```
/kill @e[name="MIN ZOMPIE !!! 🙋"]
```

### Étape 3 — Réponse attendue

```
Status 200 — "Killed MIN ZOMPIE !!! 🙋"
```

> Si aucun mob ne correspond :
>
> ```
> Status 200 — "No entity was found"
> ```

---

## 4. Tester avec Postman

### Requête POST

| Champ   | Valeur                           |
| ------- | -------------------------------- |
| Méthode | `POST`                           |
| URL     | `http://localhost:3000/mobs`     |
| Header  | `Content-Type: application/json` |
| Body    | raw / JSON                       |

```json
{
	"type": "minecraft:zombie",
	"x": "-180",
	"y": "71",
	"z": "-119",
	"CustomName": "MIN ZOMPIE !!! 🙋",
	"CustomNameVisible": 1
}
```

### Requête DELETE

| Champ   | Valeur                           |
| ------- | -------------------------------- |
| Méthode | `DELETE`                         |
| URL     | `http://localhost:3000/mobs`     |
| Header  | `Content-Type: application/json` |
| Body    | raw / JSON                       |

```json
{
	"CustomName": "MIN ZOMPIE !!! 🙋"
}
```

### Erreurs fréquentes

| Erreur                | Cause                              | Solution                                 |
| --------------------- | ---------------------------------- | ---------------------------------------- |
| `ECONNREFUSED`        | L'API n'est pas lancée             | Lancer `npm start`                       |
| `Cannot DELETE /mobs` | Header `Content-Type` manquant     | Ajouter `Content-Type: application/json` |
| `400 Bad Request`     | Champ requis manquant dans le body | Vérifier les champs obligatoires         |

---

## 5. Tests automatisés

### Étape 1 — Vérifier le script dans `package.json`

```json
"scripts": {
    "start": "node index.js",
    "test": "node --test --experimental-test-module-mocks"
}
```

### Étape 2 — Exporter `connectRcon` depuis `index.js`

Pour que les tests puissent attendre que RCON soit prêt, il faut extraire la connexion dans une fonction exportée :

```js
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

export const server = app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
```

### Étape 3 — Structure du fichier `tests/mobs.test.js`

`before` attend que RCON soit connecté avant de lancer les tests. `after` ferme proprement le serveur et la connexion RCON :

```js
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app, server, connectRcon, rcon } from "../index.js";

describe("TEST /mobs", () => {
	before(async () => {
		await connectRcon();
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
```

> **Note :** Les deux tests sont dans le même `describe` pour partager le `before`/`after`. Le test POST doit s'exécuter avant le DELETE — il spawne le zombie que le DELETE va ensuite tuer.

### Étape 4 — Lancer les tests

```bash
npm test
```

Résultat attendu :

```
Server is running on http://localhost:3000
[RCON] Connected at 0.0.0.0:25575
[RCON] Connected at 0.0.0.0:25575
▶ TEST /mobs
  ✔ test POST /mobs (148ms)
  ✔ test DELETE /mobs (43ms)
✔ TEST /mobs (228ms)
[RCON] Disconnected from 0.0.0.0:25575
```
