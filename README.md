# Kaetram

[![Version](https://img.shields.io/github/package-json/v/Veradictus/Kaetram-Open?style=flat-square)](https://github.com/Veradictus/Kaetram-Open)
[![MPL-2.0 License](https://img.shields.io/github/license/Veradictus/Kaetram-Open?style=flat-square)](https://github.com/Veradictus/Kaetram-Open/blob/master/LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkaetram.com%2F&style=flat-square)](https://kaetram.com/)
[![Open Issues](https://img.shields.io/github/issues/Veradictus/Kaetram-Open?style=flat-square)](https://github.com/Veradictus/Kaetram-Open/issues)
[![Watch This Repo](https://img.shields.io/github/watchers/Veradictus/Kaetram-Open?style=social&icon=github)](https://github.com/Veradictus/Kaetram-Open/subscription) <!-- /watchers -->
[![Star This Repo](https://img.shields.io/github/stars/Veradictus/Kaetram-Open?style=social&icon=github)](https://github.com/Veradictus/Kaetram-Open/stargazers)
[![Fork This Repo](https://img.shields.io/github/forks/Veradictus/Kaetram-Open?style=social&icon=github)](https://github.com/Veradictus/Kaetram-Open/fork)
[![Discord](https://img.shields.io/discord/583033499741847574?logo=discord&color=7289da&style=flat-square)](https://discord.gg/MmbGAaw)
[![Subreddit subscribers](https://img.shields.io/reddit/subreddit-subscribers/kaetram?style=social&icon=reddit)](https://www.reddit.com/r/kaetram/)

Kaetram is an open-source game-engine created to aid those interested in entering the game development realm. The codebase is simple, clean, and intuitive, and is intended to be used as a learning tool. The original idea is based on Little Workshop's demo game &ndash; BrowserQuest. The assets have remained the same, but the code itself has been completely wiped and redone from the ground up.

**Live Version** &ndash; <https://kaetram.com>

**Discord** &ndash; <https://discord.gg/MmbGAaw>

![Demo1](https://i.imgur.com/cZTFqnd.png)
![Demo2](https://i.imgur.com/jS5d3oq.png)
![Demo3](https://i.imgur.com/slnzrZB.png)

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

You must first [install Node JS](https://nodejs.org/en/download/) to run the server, and then [install MongoDB](https://www.mongodb.com/download-center/community) in order to create a user and a database.

Before starting Kaetram, make sure you rename the `config.json-dist` to `config.json` and modify them accordingly. There are two configurations in `server/` and `client/data`.

```console
npm install
npm start
```

## Map Parsing

Once you finish modifying your map in `tools/map/data` you can parse the map data by executing `exportmap.ts` in `tools/map` directory.
Example command:

```console
npx ts-node ./exportmap.ts ./data/map.json
```

In order to build the current game map you can run

```console
# NPM
npm run map

# Yarn
yarn map
```

## TODO

- Write documentation outlining the entirety of the source code.
- Come up with a storyline.
- Implement anti-cheating.
- Implement special abilities/weapon perks.

- Add (continue) to NPC talking -- spacebar when talking
