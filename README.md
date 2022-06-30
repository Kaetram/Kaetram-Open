# Kaetram

[![Version](https://img.shields.io/github/package-json/v/Kaetram/Kaetram-Open)](https://github.com/Kaetram/Kaetram-Open/releases/latest 'Version')
[![MPL-2.0 License](https://img.shields.io/github/license/Kaetram/Kaetram-Open)][license]
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkaetram.com&style=flat)](https://kaetram.com 'Website')
[![Workflow Status](https://img.shields.io/github/workflow/status/Kaetram/Kaetram-Open/Kaetram-Open%20CI)](https://github.com/Kaetram/Kaetram-Open/actions 'Workflow Status')
[![Open Issues](https://img.shields.io/github/issues/Kaetram/Kaetram-Open)][issues]

[![Watch](https://img.shields.io/github/watchers/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/subscription 'Watch')
[![Stars](https://img.shields.io/github/stars/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/stargazers 'Stars')
[![Fork](https://img.shields.io/github/forks/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/fork 'Fork')
[![Discord](https://img.shields.io/discord/583033499741847574?logo=discord&color=7289da&style=flat)][discord]
[![YouTube](https://img.shields.io/badge/YouTube-white?logo=youtube&logoColor=f00)](https://www.youtube.com/channel/UCBbxPvvBlEsBi3sWiPJA6wQ 'YouTube')

Kaetram is an open-source game engine created to aid those interested in entering the game
development realm, and intended to be used as a learning tool. The codebase is simple, clean, and
intuitive. The original idea is based on Little Workshop's demo game&mdash;BrowserQuest (BQ), and
uses original BQ assets as well as custom-made ones. The entire codebase has been rewritten from
scratch using more modern approaches.

Live Version &ndash; <https://kaetram.com>

Join us on Discord &ndash; <https://discord.gg/MmbGAaw>

![Demo 1](https://i.imgur.com/slnzrZB.png 'Demo 1')

![Demo 2](https://i.imgur.com/jS5d3oq.png 'Demo 2')

![Demo 3](https://i.imgur.com/cZTFqnd.png 'Demo 3')

## Technologies

BQ was intended as an experiment to showcase HTML5 capabilities, since then, technology has only
served to advance. Kaetram contains a lot of ideas and [features](#features) that build on top of
its predecessor, a couple being:

- Multiplayer using [Socket.IO](https://socket.io).
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles).
- Region system (client receives only necessary data and saves it).
- Questing and achievements system.
- Plugin-based combat system (for bosses/special enemies).
- Supports RESTful API.
- Discord server integration.
- Cross-server private messaging and interactions.
- Yarn v3 with workspaces for monorepo packaging.
- And much more!

## Get Started

### Prerequisites

You must first [install Node.js](https://nodejs.org/en/download) to run the project, and
_optionally_ [install MongoDB](https://www.mongodb.com/try/download/community) to store user data
on the server.

#### NOTE: Node.js

> You need to use a Node.js version greater than or equal to `14.19.0`, following the
> [Long Term Support (LTS) schedule](https://nodejs.org/en/about/releases), to have the most
> stable experience when developing/experimenting with Kaetram. Older versions would not work
> with our current dependencies and package manager.

#### NOTE: MongoDB

> MongoDB is not a requirement for Kaetram to run, but you can store and save user data if you
> install it and run an online environment with all the features enabled. To do this, see
> [Configuration](#configuration), and set `OFFLINE_MODE=false`.
> _If you do choose to install MongoDB, a user is not necessary, but you can enable authentication
> with the `MONGODB_AUTH` setting._

#### Yarn

You will also need to enable Yarn to manage your dependencies.

> The preferred way to manage Yarn is through
> [Corepack](https://nodejs.org/dist/latest/docs/api/corepack.html)
>
> <https://yarnpkg.com/getting-started/install>

Starting from Node.js `14.19.0`, Corepack is included by default with, but is currently opt-in.

To enable it, run

```console
corepack enable
```

### Installing

Install the dependencies by simply running

```console
yarn
```

### Running

To run live development builds, use

```console
yarn dev
```

To create production builds, run

```console
yarn build
```

Then, to run each production build, use

```console
yarn start
```

Add `--host` at the end to make the game visible on your network.

### Configuration

_Optionally_, if you would want some additional configuration, There will see a file named
[`.env.defaults`](.env.defaults), and it's values will be used unless overridden by a new `.env`
file, or by setting environmental variables.

Copy and rename `.env.defaults` to `.env`, and modify the contents to fit your needs.

_Keep in mind_, you have to rebuild the client and restart the server every time you change your configuration.

## End to end testing

To run the end to end tests you can simply go to the `packages/e2e` folder and run the yarn command

The tests will make use of the `.env.locale2e` configuration file
```console
yarn run mongo:restart
yarn run test:run
```
Alternatively, if you want to have the test environment open interactively so you can select the test you want to run
in the UI, you can use the command
```console
yarn run mongo:restart
yarn run test:open
```
Lastly, if you want to run a single test during development you can start the client and server manually and directly run
```console
yarn run cy:open
```

## Features

### Regions

The region system sends data to the client according to the map data of the server. The collisions
are checked both server-side and client-side to avoid cheating. The region system makes use of
dynamic tiles, which are unlocked according to a player's progress. Furthermore, there is integrated
support for instancing, where we can use a section of the map (or clone it), and reuse it for
certain groups of players. The instancing is perfect for activities such as minigames, where we will
want to run multiple instances in parallel.

### Tilemap

Kaetram is built with modularity in mind, as such, the client supports multiple tileset parsing. The
tilemap can easily be constructed using the [Tiled Map Editor](https://www.mapeditor.org/). Using
our [map parsing](#map-parsing) tool, you can easily export your creation to both the client and the
server.

### Map Parsing

Once finished modifying your map in [`packages/tools/map/data/`](packages/tools/map/data/), you can
parse the map data by executing `yarn exportmap` inside the [`packages/tools/`](packages/tools/)
directory.

Example command:

```console
yarn exportmap ./data/map.json
```

To build the current game map, you can run

```console
yarn map
```

### Kaetram Hub

There is also support for a hub server. This can help connect servers across one another, allowing
players to interact with their friends across them in a variety of ways (private messaging and
guilds). Furthermore, the hub serves as a gateway for determining what server to place players in.
If a server is full, it simply returns another server that has room for the player.

To enable using the hub server, see [Configuration](#configuration), and set these values to `true`.

```sh
API_ENABLED=true
HUB_ENABLED=true
```

## Roadmap

Here we have [The Roadmap Project Board](https://github.com/Kaetram/Kaetram-Open/projects/1). This
is the main board of the Kaetram-Open project. A kind of Kanban tasks board for tracking and
presenting the progress to the community. Here we plan, prioritize and track our work.

See also the [open issues][issues] for a list of proposed features (and known issues).

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

#### Codebase Development

- Write documentation outlining the entirety of the source code.
- Improvements and optimizations to the lighting system.

#### Miscellaneous

- Add (continue) to NPC talking&mdash;spacebar when talking

## Donations

### Sponsor

Patreon &ndash; <https://www.patreon.com/kaetram>

Open Collective &ndash; <https://opencollective.com/kaetram>

### Crypto

`BTC` &ndash; `bc1qeh0tdlkuc5q82j2qk9h3sqmwe6uy75qpjtc0dv`

`LTC` &ndash; `MMRo7dfAi2T8rJrx7m3DmzhsgHRC7XJ83f`

`ETH` &ndash; `0x4c6de7175f789DAf0f531477753B07402EEfedaC`

`BCH` &ndash; `bitcoincash:qzx6uqunqj4mtv74jng97pea0mfcl4nmyqsew92enu`

## License & Commission

For all inquiries about purchasing a different license or commission work, please contact
**@Keros** on [Discord][discord].

This project is distributed under the
**[Mozilla Public License Version 2.0](https://choosealicense.com/licenses/mpl-2.0/)**. See
[`LICENSE`][license] for more information.

[license]: LICENSE 'Project License'
[issues]: https://github.com/Kaetram/Kaetram-Open/issues 'Open Issues'
[discord]: https://discord.gg/MmbGAaw 'Join Discord'
