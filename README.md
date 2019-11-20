# Kaetram

Kaetram is an open-source game-engine created to aid those interested in entering the game development realm. The codebase is simple, clean, and intuitive, and is intended to be used as a learning tool. The original idea is based on Little Workshop's demo game - BrowserQuest. The assets have remained the same, but the code itself has been completely wiped and redone from the ground up.

Live Version - <https://kaetram.com>

Discord - <https://discord.gg/MmbGAaw>

![Demo](https://i.imgur.com/M7N8RRp.png)

## Features

Features include what you'd expect from an MMORPG.

- Multiplayer
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles)
- Region system (client receives only necessary data and saves it)
- Questing and achievements system.
- Plugin-based combat system (for bosses/special enemies)
- And much more

### Region Manager

The region system sends data to the client according to the map data of the server. The collisions are checked both server-side and client-side in order to avoid cheating. The region-system has also been updated such that users can create instanced versions of the same area. These areas can be used to draw 'alternate' versions of the map, and be used for special events such as minigames. Multiple players can also be added to these regions.

### Tilesheet Parsing

The rendering engine has been updated such that it is able to handle multiple tilesheets the same way Tiled editor can. Simply drop in your tilesheet in the `client/img/tilesets`.

## Installing and Running

You must install MongoDB and create a user and a database.

```sh
npm install
npm start
```

Prior to starting Kaetram, make sure you rename the `config.json-dist` to `config.json` and modify them accordingly. There are two configurations in `server/` and `client/data`.

## Map Parsing

Once you finish modifying your map in `tools/maps/data` you can parse the map data by executing `exportmap.js` in `tools/maps` directory. Example command:

```sh
./exportmap.js ./data/map.json
```

## TODO

- Write documentation outlining the entirety of the source code.
- Come up with a storyline.

- Add (continue) to NPC talking -- spacebar when talking
