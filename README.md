# Kaetram

[![Version](https://img.shields.io/github/package-json/v/Kaetram/Kaetram-Open)](https://github.com/Kaetram/Kaetram-Open/releases/latest 'Version')
[![MPL-2.0 License](https://img.shields.io/github/license/Kaetram/Kaetram-Open)][license]
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkaetram.com&style=flat)](https://kaetram.com 'Website')
[![Build Status](https://img.shields.io/github/actions/workflow/status/Kaetram/Kaetram-Open/build.yml?branch=develop&label=build)](https://github.com/Kaetram/Kaetram-Open/actions/workflows/build.yml 'Build Status')
[![E2E Status](https://img.shields.io/github/actions/workflow/status/Kaetram/Kaetram-Open/e2e.yml?branch=develop&label=e2e)](https://github.com/Kaetram/Kaetram-Open/actions/workflows/e2e.yml 'E2E Status')
[![Open Issues](https://img.shields.io/github/issues/Kaetram/Kaetram-Open)][issues]

[![Watch](https://img.shields.io/github/watchers/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/subscription 'Watch')
[![Stars](https://img.shields.io/github/stars/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/stargazers 'Stars')
[![Fork](https://img.shields.io/github/forks/Kaetram/Kaetram-Open?style=social&icon=github)](https://github.com/Kaetram/Kaetram-Open/fork 'Fork')
[![Discord](https://img.shields.io/discord/583033499741847574?logo=discord&color=5865f2&style=flat)][discord]
[![YouTube](https://img.shields.io/badge/YouTube-white?logo=youtube&logoColor=f00)](https://www.youtube.com/channel/UC0atP4sQbb4LJd6y4jijOHg 'YouTube')
[![Twitter](https://img.shields.io/twitter/follow/kaetramofficial?style=social)](https://twitter.com/kaetramofficial 'Twitter')
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/kaetram?style=social)](https://reddit.com/r/kaetram 'Reddit')

Kaetram is an open-source 2D MMORPG that expands on the original idea created by Little Workshop's BrowserQuest (BQ).
We aim to provide a collaborative gaming experience as well as a game-engine for those interested in creating their
own version. The game is still in early development stages and all help, suggestions, and bug reports are welcome.
All of the assets are licensed under CC-BY-SA3.0 and we aim to hold onto the original BQ assets as well as expand
upon them. The entire code-base has been re-written from scratch, optimized, and documented. Please see the GitHub
wiki for information regarding development. Kaetram first started development in 2015 under the name of 
Tap Tap Adventure (TTA). In 2017, Kaetram was started as a complete re-write of the code which was formerly BQ-based.

Live Version &ndash; <https://kaetram.com>

Join us on Discord &ndash; <https://discord.gg/MmbGAaw>

![Demo 1](https://i.imgur.com/MvErlP4.png 'Demo 1')

![Demo 2](https://i.imgur.com/jS5d3oq.png 'Demo 2')

![Demo 3](https://i.imgur.com/KrqVNFw.png 'Demo 3')

![Demo 4](https://i.imgur.com/ErBNdkf.png 'Demo 4')

![Demo 5](https://i.imgur.com/L0MN6LO.png 'Demo 5')

![Demo 6](https://i.imgur.com/aFXdmpv.png 'Demo 6')

## Technologies

BQ was initially written as an HTML5 experiment showcasing the capabilities of web technologies
back in 2012. Kaetram builds on top of the idea and uses modern standards to help facilitate
readability, performance, and compatibility. Some of the many features are as follows:

- Multiplayer using [Socket.IO](https://socket.io).
- Enhanced rendering engine (includes dynamic lighting, overlays, animated tiles).
- Region/chunking system (client caches and saves data from the server as needed).
    - Dynamic tiles (tiles that change depending on player's progress in achievements/quests/etc).
    - Global objects (tiles such as trees (and more in the future) that the player can interact with).
- Trading between players
- Quest and achievement system.
- Minigame system for special in-game events.
- Plugin-based mob behaviour (used for special mobs such as bosses).
- Plugin-based item interaction.
- RESTful API for cross-server communication
- Discord server integration (in-game and discord server can communicate with eachother).
- Cross-server private messaging and interactions.
- Enhanced map parsing w/ support for compressed tilemaps.
- Yarn v3 with workspaces for monorepo packaging.
- Player synchronization amongst servers (friend lists, login status)

## Get Started

### Prerequisites

You must first [install Node.js](https://nodejs.org/en/download) to run the project, and
_optionally_ [install MongoDB](https://www.mongodb.com/try/download/community) to store user data on
the server.

#### NOTE: Node.js

> You need to use a Node.js version greater than or equal to `14.19.0`, following the
> [Long Term Support (LTS) schedule](https://nodejs.org/en/about/releases), to have the most stable
> experience when developing/experimenting with Kaetram. Older versions would not work with our
> current dependencies and package manager.

#### NOTE: MongoDB

> MongoDB is not a requirement for Kaetram to run, but you can store and save user data if you
> install it and run an online environment with all the features enabled. To do this, see
> [Configuration](#configuration), and set `SKIP_DATABASE=false`. _If you do choose to install
> MongoDB, a user is not necessary, but you can enable authentication with the `MONGODB_AUTH`
> setting._

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

Optionally, if you want some additional configuration, There is a file named
[`.env.defaults`](.env.defaults), and it's values will be used unless overridden by a new `.env`
file, or by setting environmental variables.

Copy and rename [`.env.defaults`](.env.defaults) to `.env`, and modify the contents to fit your
needs.

_Keep in mind_, you have to rebuild the client and restart the server every time you change your
configuration.

## Testing

### End to End

As a [prerequisite](#prerequisites) to run the E2E tests, you need a MongoDB server running as well.

[Configuration](#configuration) for test-only environments can be configured on
[`.env.e2e`](`.env.e2e`). All it's values will fallback to `.env`, then to
[`.env.defaults`](.env.defaults), if present.

To run test on your console, use

```console
yarn test:run
```

Alternatively, if you want to have the test environment open interactively, so you can select the
test you want to run in a UI, use

```console
yarn test:open
```

## Features

### Regions

The region system works by segmenting the map into smaller chunks that are then sent to the client. The client caches
the map data and stores it for quicker loading in the local storage. When a new map version is present, the client
purges the cache and starts the process again. The region system is split into static tiles and dynamic tiles. Static
tiles do not undergo a change and are part of the map permanently. Dynamic tiles change depending on conditions such
as a player's achievement/quest progress, or, in the case of trees, depending on whether the tree has been cut or not.
In the future we plan to use this region system to create instanced versions of areas, for example running multiple minigame
instances at the same time.

Video example showcasing region system using an exaggerated example:
[![Kaetram Region System](https://img.youtube.com/vi/pt_CEgjfORE/0.jpg)](https://www.youtube.com/watch?v=pt_CEgjfORE)

### Tilemap

Kaetram uses [Tiled Map Editor](https://www.mapeditor.org/) to create and modify the map. Our [map parsing](#map-parsing) tool
is used to export a condesed version of the map data. The server receives the bulk of the information and uses it to calculate
collisions, tile data information, and areas (pvp, music, etc). The client stores minimal data such as tile 'z-index' and animations.

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

The hub functions as a gateway between servers. Due to performance limitations of NodeJS it is more feasible
to host multiple servers instead of one big one containing thousands of players. The hub does exactly that, once
the hub is running and a server instance is given the host address for the hub, it will automatically connect. The
hub becomes the primary connection point for the client. When a request for connection is received, the hub
will pick the first server that has room for the player. Alternatively, it allows players to select any server
amongst the list of servers.

To enable the hub server, see [Configuration](#configuration), and set these values to `true`.

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

- Add special attacks to weapons
- Add functionality to the special abilities
- Add player-owned guilds and/or parties
- Weapons/armours/rings/pendants enchantments
- Diversify game content (add more skills, minigames, activities, items, etc)
- Improve usability of the user interface on mobile devices
- Move pathfinding to the server-side once alpha is over

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

For all inquiries about purchasing a different license or commission work, please contact **@Keros**
on [Discord][discord].

This project is distributed under the
**[Mozilla Public License Version 2.0](https://choosealicense.com/licenses/mpl-2.0/)**. See
[`LICENSE`][license] for more information.

[license]: LICENSE 'Project License'
[issues]: https://github.com/Kaetram/Kaetram-Open/issues 'Open Issues'
[discord]: https://discord.gg/MmbGAaw 'Join Discord'
