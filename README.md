# Kaetram

[![Version](https://img.shields.io/github/package-json/v/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open)
[![Open Issues](https://img.shields.io/github/issues/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open/issues)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkaetram.com%2F)](https://kaetram.com/)
[![Fork This Repo](https://img.shields.io/github/forks/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open/fork)
[![Star This Repo](https://img.shields.io/github/stars/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open)
[![Watch This Repo](https://img.shields.io/github/watchers/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open)
[![MPL-2.0 License](https://img.shields.io/github/license/Veradictus/Kaetram-Open)](https://github.com/Veradictus/Kaetram-Open/blob/master/LICENSE)
[![Discord](https://img.shields.io/discord/583033499741847574)](https://discord.gg/MmbGAaw)
[![Subreddit subscribers](https://img.shields.io/reddit/subreddit-subscribers/kaetram?style=social)](https://www.reddit.com/r/kaetram/)
[![Send Tip](https://img.shields.io/static/v1?label=BAT&message=Send%20a%20Tip&style=flat&logo=brave&color=fb542b)]()

Kaetram is an open-source game-engine created to aid those interested in entering the game development realm. The codebase is simple, clean, and intuitive, and is intended to be used as a learning tool. The original idea is based on Little Workshop's demo game - BrowserQuest. The assets have remained the same, but the code itself has been completely wiped and redone from the ground up.

Live Version - <https://kaetram.com>

Discord - <https://discord.gg/MmbGAaw>

![Demo](https://i.imgur.com/cZTFqnd.png)
![Demo1](https://i.imgur.com/jS5d3oq.png)
![Demo2](https://i.imgur.com/slnzrZB.png)

## Features

Features include what you'd expect from an MMORPG.

- Multiplayer
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles)
- Region system (client receives only necessary data and saves it)
- Questing and achievements system.
- Plugin-based combat system (for bosses/special enemies)
- And much more

### Region Manager

The region system sends data to the client according to the map data of the server. The collisions are checked both server-side and client-side to avoid cheating. The region-system has also been updated such that users can create instanced versions of the same area. These areas can be used to draw 'alternate' versions of the map, and be used for special events such as minigames. Multiple players can also be added to these regions.

### Tileset Parsing

The rendering engine has been updated such that it can handle multiple tilesets the same way Tiled editor can. Simply drop in your tileset in the `client/img/tilesets`.

## Installing and Running

You must install MongoDB to create a user and a database.

```console
npm install
npm start
```

Before starting Kaetram, there is some configuration that must be done. In `server/` directory, rename `config.js-dist` to `config.js`. Modify the file as to fit your needs. Similar procedure for the `client/data` directory, simply rename `config.json-dist` to `config.json`. Make sure the settings in the client match those in the server.

## Map Parsing

Once you finish modifying your map in `tools/maps/data` you can parse the map data by executing `exportmap.js` in `tools/maps` directory. Example command:

```console
./exportmap.js ./data/map.json
```

In order to build the current game map you can run

```console
npm run map
```

## TODO

- Write documentation outlining the entirety of the source code.
- Come up with a storyline.
- Implement anti-cheating.
- Implement special abilities/weapon perks.

- Add (continue) to NPC talking -- spacebar when talking
