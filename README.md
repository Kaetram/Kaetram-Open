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

Kaetram is an open-source game-engine created to aid those interested in entering the game development realm. The codebase is simple, clean, and intuitive. This project is intended to be used as a learning tool. The original idea is based on Little Workshop's demo game - BrowserQuest (BQ). This game uses original BQ assets as well as custom-made ones. The entire code-base has been written from scratch, using more modern approaches.

Live Version - <https://kaetram.com>

Join us on Discord - <https://discord.gg/MmbGAaw>

Patreon - https://www.patreon.com/kaetram

Check out Kaetram-Next for the TypeScript version of Kaetram - <https://github.com/lemueldls/Kaetram-Next>


![Demo](https://i.imgur.com/slnzrZB.png)
![Demo1](https://i.imgur.com/jS5d3oq.png)
![Demo2](https://i.imgur.com/cZTFqnd.png)

## Features

BQ was intended as an experiment to showcase HTML5 capabilities, since then, technology has only served to advance. Kaetram contains a lot of ideas and features that builds on top of its predecesor, a couple are:

- Multiplayer using Socket.IO
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles)
- Region system (client receives only necessary data and saves it)
- Questing and achievements system.
- Plugin-based combat system (for bosses/special enemies).
- Supports RESTful API.
- Discord server integration.
- Cross-server private messaging and interactions.
- And much more

### Regions

The region system sends data to the client according to the map data of the server. The collisions are checked both server-side and client-side to avoid cheating. The region system makes use of dynamic tiles, which are unlocked according to a player's progress. Furthermore, there is integrated support for instancing, where we can use a section of the map (or clone it) and reuse it for certain groups of players. The instancing is perfect for activities such as minigames, where we will want to run multiple instances in parallel.

### Tilemap

Kaetram is built with modularity in mind, as such, the client supports multiple tileset parsing. The tilemap can easily be constructed using [Tiled Map Editor](https://www.mapeditor.org/). Using our map parsing tool located in `tools/map/exportmap.js` you can easily export your creation to both the client and the server.

### Kaetram Hub

There is also support for a hub server. This can help connect servers across one another, allowing players to interact with their friends across them in a variety of ways (private messaging and guilds). Furthermore, the hub serves as a gateway for determining what server to place players in. If a server is full, it simply returns another server that has room for the player.

## Installing and Running

Before starting Kaetram, there is some configuration that must be done. In `server/` directory, rename `config.js-dist` to `config.js`. Modify the file as to fit your needs. Similar procedure for the `client/data` directory, simply rename `config.json-dist` to `config.json`. Make sure the settings in the client match those in the server.

MongoDB is a requirement for Kaetram to run with all the features enabled, but you can still run your own limited version if you do not want to install MongoDB. To do this, set `offlineMode = true` in the server configuration.

If you do choose to install MongoDB, a user is not necessary, but you can enable authentication with the `mongoAuth` variable in the server configuration.

```console
npm install
npm start
```

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

#### Gameplay

- Finalize the new map.
- Polish mob attributes.
- Have a consistent storyline that goes with the game.
- Implement special abilities and weapon perks.
- Improve anti-cheating detections.
- Add minigames

#### Code-base Development

- Write documentation outlining the entirety of the source code.
- Improvements and optimizations to the lighting system.

#### Miscellaneous

- Add (continue) to NPC talking -- spacebar when talking
