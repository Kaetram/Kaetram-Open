# Kaetram

[![Version](https://img.shields.io/github/package-json/v/Kaetram/Kaetram-Open?style=flat)](https://github.com/Kaetram/Kaetram-Open)
[![MPL-2.0 License](https://img.shields.io/github/license/Kaetram/Kaetram-Open?style=flat)](https://github.com/Kaetram/Kaetram-Open/blob/master/LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkaetram.com%2F&style=flat)](https://kaetram.com/)
[![Open Issues](https://img.shields.io/github/issues/Kaetram/Kaetram-Open?style=flat)](https://github.com/Kaetram/Kaetram-Open/issues)
[![Watch This Repo](https://img.shields.io/github/watchers/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/subscription)
[![Star This Repo](https://img.shields.io/github/stars/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/stargazers)
[![Fork This Repo](https://img.shields.io/github/forks/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/fork)
[![Discord](https://img.shields.io/discord/583033499741847574?logo=discord&color=7289da&style=flat)](https://discord.gg/MmbGAaw)

Kaetram is an open-source game-engine created to aid those interested in entering the game
development realm. The codebase is simple, clean, and intuitive. This project is intended to be used
as a learning tool. The original idea is based on Little Workshop's demo game&mdash;BrowserQuest
(BQ). This game uses original BQ assets as well as custom-made ones. The entire code-base has been
written from scratch, using more modern approaches.

Live Version &ndash; <https://kaetram.com>

Join us on Discord &ndash; <https://discord.gg/MmbGAaw>

Patreon &ndash; <https://www.patreon.com/kaetram>

![Demo1](https://i.imgur.com/slnzrZB.png)
![Demo2](https://i.imgur.com/jS5d3oq.png)
![Demo3](https://i.imgur.com/cZTFqnd.png)

## Table of Contents

- [Kaetram](#kaetram)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Regions](#regions)
    - [Tilemap](#tilemap)
    - [Map Parsing](#map-parsing)
    - [Kaetram Hub](#kaetram-hub)
  - [Get Started](#get-started)
    - [Prerequisites](#prerequisites)
      - [NOTE: Node.js](#note-nodejs)
      - [NOTE: MongoDB](#note-mongodb)
    - [Installing and Running](#installing-and-running)
  - [Roadmap](#roadmap)
    - [TODO](#todo)
      - [Gameplay](#gameplay)
      - [Code-base Development](#code-base-development)
      - [Miscellaneous](#miscellaneous)
  - [License](#license)

## Features

BQ was intended as an experiment to showcase HTML5 capabilities, since then, technology has only
served to advance. Kaetram contains a lot of ideas and features that builds on top of its
predecessor, a couple are:

- Multiplayer using [Socket.IO](https://socket.io)
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles)
- Region system (client receives only necessary data and saves it)
- Questing and achievements system.
- Plugin-based combat system (for bosses/special enemies).
- Supports RESTful API.
- Discord server integration.
- Cross-server private messaging and interactions.
- Lerna monorepo packaging
- And much more

### Regions

The region system sends data to the client according to the map data of the server. The collisions
are checked both server-side and client-side to avoid cheating. The region system makes use of
dynamic tiles, which are unlocked according to a player's progress. Furthermore, there is integrated
support for instancing, where we can use a section of the map (or clone it) and reuse it for certain
groups of players. The instancing is perfect for activities such as minigames, where we will want to
run multiple instances in parallel.

### Tilemap

Kaetram is built with modularity in mind, as such, the client supports multiple tileset parsing. The
tilemap can easily be constructed using [Tiled Map Editor](https://www.mapeditor.org/). Using our
map parsing tool located in [`tools/map/exportmap.js`](tools/map/exportmap.js) you can easily export
your creation to both the client and the server.

### Map Parsing

Once you finish modifying your map in `tools/maps/data` you can parse the map data by executing
`exportmap.js` in `tools/maps` directory. Example command:

```console
./exportmap.js ./data/map.json
```

In order to build the current game map you can run

```console
npm run map
```

### Kaetram Hub

There is also support for a hub server. This can help connect servers across one another, allowing
players to interact with their friends across them in a variety of ways (private messaging and
guilds). Furthermore, the hub serves as a gateway for determining what server to place players in.
If a server is full, it simply returns another server that has room for the player.

## Get Started

### Prerequisites

You must first [install Node.js](https://nodejs.org/en/download/) to run the server, and
[install MongoDB](https://www.mongodb.com/download-center/community) database to store user data.

#### NOTE: Node.js

> We recommend you use Node.js version greater or equal to `12.0.0` in order to have the
> most stable experience when developing/experimenting with Kaetram. Older versions may work
> but have not been tested.

#### NOTE: MongoDB

> MongoDB is a requirement for Kaetram to run with all the features enabled, but you can still run
> your own limited version if you do not want to install MongoDB. To do this, set
> `Config.offlineMode = true` in the server configuration. _If you do choose to install MongoDB, a
> user is not necessary, but you can enable authentication with the `Config.mongoAuth` variable in
> the [server configuration](packages/server/config.ts)._

You will need to [install Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)

After installing Yarn, install all packages by running

```console
yarn install
```

### Installing and Running

Before starting Kaetram, there is some configuration that must be done. In `packages/server/` directory,
rename `.env-dist` to `.env`. Modify the file as to fit your needs. Similar procedure for
the `packages/client/` directory, simply rename `.env-dist` to `.env`. Make sure the
settings in the client match those in the server.

MongoDB is a requirement for Kaetram to run with all the features enabled, but you can still run
your own limited version if you do not want to install MongoDB. To do this, set `offlineMode = true`
in the server configuration.

If you do choose to install MongoDB, a user is not necessary, but you can enable authentication with
the `mongoAuth` variable in the server configuration.

As of now a production build is not available so for running a development server, run

```console
npm run dev
```

## Roadmap

Here we have [The Roadmap Project Board](https://github.com/Kaetram/Kaetram-Open/projects/1). This
is the main board of the Kaetram-Open project. A kind of Kanban tasks board for tracking and
presenting the progress to the community. Here we plan, prioritize and track our work.

See also the [open issues](https://github.com/Kaetram/Kaetram-Open/issues) for a list of proposed
features (and known issues).

### TODO

#### Gameplay

- Finalize the new map.
- Polish mob attributes.
- Have a consistent storyline that goes with the game.
- Implement special abilities and weapon perks.
- Improve anti-cheating detections.
- Add PvP
- Add minigames (PvP, Capture the Flag, Hold the Base)
- Improve client/server synchronization for all players
- Add player trading abilities
- Transition to a more suitable WebGL framework
- Add friends list
- Improve the enchanting system
- Make bosses more responsive
- All trees in the world must be cuttable

#### Code-base Development

- Write documentation outlining the entirety of the source code.
- Improvements and optimizations to the lighting system.

#### Miscellaneous

- Add (continue) to NPC talking&mdash;spacebar when talking

<!-- ## Running Tests

> TODO: Tests are unfinished, yet alone barley even started.

Tests _and coverage_ are ran with [Jest](https://jestjs.io/) To run the tests,
simply run

```console
npm test
``` -->

<!-- ## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

Contributions are what make the open source community such an amazing place to be learn, inspire,
and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request -->

## License

This project is distributed under the MPL-2.0 License. See [`LICENSE`](LICENSE) for more
information.
