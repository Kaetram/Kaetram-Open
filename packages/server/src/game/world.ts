import _ from 'lodash';

import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Rocks from '../../data/professions/rocks';
import Trees from '../../data/professions/trees';
import Entities from '../controllers/entities';
import GlobalObjects from '../controllers/globalobjects';
import Minigames from '../controllers/minigames';
import Shops from '../controllers/shops';
import Grids from '../map/grids';
import Map from '../map/map';
import API from '../network/api';
import Discord from '../network/discord';
import Messages, { Packet } from '../network/messages';
import Network from '../network/network';
import Region from '../region/region';
import Mobs from '../util/mobs';
import Character from './entity/character/character';

import type { Rock, Tree } from '@kaetram/common/types/map';
import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Mob from './entity/character/mob/mob';
import type Player from './entity/character/player/player';
import type Entity from './entity/entity';

type PlayerConnectCallback = (connection: Connection) => void;

interface WorldPacket {
    [key: string]: unknown;
    message: Packet;
}

interface DynamicObject {
    [key: string]: {
        [id: string]: {
            index: number;
            objectTile: number | number[];
        };
    };
}

interface DynamicData<T> {
    [id: string]: T & {
        data: {
            [key: string]: {
                index: number;
                oldTiles: number | number[];
            };
        };
        time: number;
    };
}

export default class World {
    private maxPlayers;
    private updateTime;
    // private debug = false;
    public allowConnections = false;

    // Lumberjacking Variables
    private trees: DynamicObject = {};
    private cutTrees: DynamicData<{ treeId: number }> = {};

    // Mining Variables
    private rocks: DynamicObject = {};
    private depletedRocks: DynamicData<{ rockId: number }> = {};

    // private loadedRegions = false;
    public ready = false;

    public map!: Map;
    public api!: API;
    public shops!: Shops;
    public region!: Region;
    public entities!: Entities;
    public network!: Network;
    public discord!: Discord;
    public minigames!: Minigames;
    public globalObjects!: GlobalObjects;

    public playerConnectCallback?: PlayerConnectCallback;
    public populationCallback?(): void;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.socketHandler = socketHandler;
        this.database = database;

        this.maxPlayers = config.maxPlayers;
        this.updateTime = config.updateTime;
    }

    public load(onWorldLoad: () => void): void {
        log.info('************ World Information ***********');

        /**
         * The reason maps are loaded per each world is because
         * we can have slight modifications for each world if we want in the
         * future. Using region loading, we can just send the client
         * whatever new map we have created server sided. Cleaner and nicer.
         */

        this.map = new Map(this);
        this.map.isReady(() => {
            log.info('The map has been successfully loaded!');

            this.loaded();

            setTimeout(onWorldLoad, 100);
        });
    }

    private loaded(): void {
        /**
         * The following are all globally based 'plugins'. We load them
         * in a batch here in order to keep it organized and neat.
         */

        this.minigames = new Minigames(this);

        this.api = new API(this);
        this.shops = new Shops(this);
        this.region = new Region(this);
        this.discord = new Discord(this);
        this.entities = new Entities(this);
        this.network = new Network(this);
        this.globalObjects = new GlobalObjects(this);

        this.ready = true;

        this.tick();

        log.info('******************************************');
    }

    private async tick(): Promise<void> {
        let update = 1000 / this.updateTime,
            setIntervalAsync: (fn: () => Promise<void>, ms: number) => void = (fn, ms) =>
                fn().then(() => setTimeout(() => setIntervalAsync(fn, ms), ms));

        setIntervalAsync(async () => {
            this.network.parsePackets();
            this.region.parseRegions();
        }, update);

        setIntervalAsync(async () => {
            this.parseTrees();
        }, config.treeTick || 1000);

        if (!config.hubEnabled) return;

        await import('@kaetram/hub');

        if (!config.apiEnabled) log.error('Server is in hub-mode but API is not enabled!');

        setIntervalAsync(async () => {
            this.api.pingHub();
        }, config.hubPing);
    }

    /****************************
     * Entity related functions *
     ****************************/

    public kill(character: Character): void {
        character.applyDamage(character.hitPoints);

        this.push(Opcodes.Push.Regions, [
            {
                regionId: character.region,
                message: new Messages.Points({
                    id: character.instance,
                    hitPoints: character.getHitPoints(),
                    mana: null
                })
            },
            {
                regionId: character.region,
                message: new Messages.Despawn(character.instance)
            }
        ]);

        this.handleDeath(character, true);
    }

    public handleDamage(
        attacker: Character | undefined,
        target: Character | undefined,
        damage: number
    ): void {
        if (!attacker || !target || isNaN(damage) || target.invincible) return;

        if (target.type === 'player' && target.hitCallback) target.hitCallback(attacker, damage);

        // Stop screwing with this - it's so the target retaliates.

        target.hit(attacker);
        target.applyDamage(damage, attacker);

        this.push(Opcodes.Push.Regions, {
            regionId: target.region,
            message: new Messages.Points({
                id: target.instance,
                hitPoints: target.getHitPoints(),
                mana: null
            })
        });

        // If target has died...
        if (target.getHitPoints() < 1) {
            let player = attacker as Player;

            if (target.type === 'mob') player.addExperience(Mobs.getXp(target.id));

            if (player.type === 'player') player.killCharacter(target);

            target.combat.forEachAttacker((attacker) => {
                attacker.removeTarget();
            });

            this.push(Opcodes.Push.Regions, [
                {
                    regionId: target.region,
                    message: new Messages.Combat(Opcodes.Combat.Finish, {
                        attackerId: attacker.instance,
                        targetId: target.instance
                    })
                },
                {
                    regionId: target.region,
                    message: new Messages.Despawn(target.instance)
                }
            ]);

            this.handleDeath(target, false, attacker);
        }
    }

    public handleDeath(character: Character, ignoreDrops = false, lastAttacker?: Character): void {
        if (!character) return;

        if (character.type === 'mob') {
            let mob = character as Mob,
                deathX = mob.x,
                deathY = mob.y;

            if (lastAttacker) mob.lastAttacker = lastAttacker;

            mob.deathCallback?.();

            this.entities.remove(mob);

            mob.dead = true;

            mob.destroy();

            mob.combat.stop();

            if (!ignoreDrops) {
                let drop = mob.getDrop();

                if (drop) this.entities.dropItem(drop.id, drop.count, deathX, deathY);
            }
        } else if (character.type === 'player') {
            let player = character as Player;

            player.die();
        }
    }

    private parseTrees(): void {
        let time = Date.now(),
            treeTypes = Object.keys(Modules.Trees);

        _.each(this.cutTrees, (tree, key) => {
            let type = treeTypes[tree.treeId];

            if (time - tree.time < Trees.Regrowth[type as Tree]) return;

            _.each(tree.data, (tile) => {
                this.map.data[tile.index] = tile.oldTiles;
            });

            let position = this.map.idToPosition(key),
                regionId = this.map.regions.regionIdFromPosition(position.x, position.y);

            this.region.updateRegions(regionId);

            delete this.cutTrees[key];
        });
    }

    private parseRocks(): void {
        let time = Date.now(),
            rockTypes = Object.keys(Modules.Rocks);

        _.each(this.depletedRocks, (rock, key) => {
            let type = rockTypes[rock.rockId];

            if (time - rock.time < Rocks.Respawn[type as Rock]) return;

            _.each(rock.data, (tile) => {
                this.map.data[tile.index] = tile.oldTiles;
            });

            let position = this.map.idToPosition(key),
                regionId = this.map.regions.regionIdFromPosition(position.x, position.y);

            this.region.updateRegions(regionId);

            delete this.depletedRocks[key];
        });
    }

    public isTreeCut(id: string): boolean {
        if (id in this.cutTrees) return true;

        for (let i in this.cutTrees) if (id in this.cutTrees[i]) return true;

        return false;
    }

    public isRockDepleted(id: string): boolean {
        if (id in this.depletedRocks) return true;

        for (let i in this.depletedRocks) if (id in this.depletedRocks[i]) return true;

        return false;
    }

    /**
     * We save trees we are about to destroy
     * to the `this.trees` and once they are destroyed
     * we pluck them into the `this.destroyedTrees`.
     * We run a tick that re-spawns them after a while
     * using the data from `this.trees`.
     */
    public destroyTree(id: string, treeId: number): void {
        let position = this.map.idToPosition(id);

        if (!(id in this.trees)) this.trees[id] = {} as never;

        this.search(position.x + 1, position.y, id, this.trees, 'tree');

        this.cutTrees[id] = {
            data: {} as never,
            time: Date.now(),
            treeId
        };

        _.each(this.trees[id], (tile, key) => {
            let tiles = this.map.data[tile.index];

            // Store the original tiles for respawning.
            this.cutTrees[id].data[key] = {
                oldTiles: [tiles].flat(), // concat to create a new array
                index: tile.index
            };

            // We do not remove tiles that do not have another tile behind them.
            if (Array.isArray(tiles)) {
                let objectTile = tile.objectTile as keyof typeof Trees.Stumps,
                    index = tiles.indexOf(objectTile);

                // We map the uncut trunk to the cut trunk tile.
                if (objectTile in Trees.Stumps) tiles[index] = Trees.Stumps[objectTile];
                else tiles.splice(index, 1);
            }
        });

        let regionId = this.map.regions.regionIdFromPosition(position.x, position.y);

        this.region.updateRegions(regionId);

        this.trees[id] = {};
    }

    /**
     * The following functions recursively iterate through tiles of
     * a certain type. For example, we can look for all the tree tiles,
     * given a starting tile, and we stop when all tiles are detected.
     * Because this method is not exactly perfect, trees have to be
     * placed one tile apart such that the algorithm does not 'leak'
     * and cut both trees.
     * `refId` - The initial object we click on.
     * `data` - The array we are working with.
     * `type` - The type of tile we are looking for.
     */

    private getSearchTile(type: string, x: number, y: number): number | number[] | undefined {
        switch (type) {
            case 'tree':
                return this.map.getTree(x, y);

            case 'rock':
                return this.map.getRock(x, y);
        }
    }

    private search(
        x: number,
        y: number,
        refId: string,
        data: DynamicObject,
        type: string
    ): boolean {
        let objectTile = this.getSearchTile(type, x, y);

        if (!objectTile) return false;

        let id = `${x}-${y}`,
            what = data[refId as keyof typeof data];

        if (id in what) return false;

        what[id as keyof typeof what] = {
            index: this.map.gridPositionToIndex(x, y) - 1,
            objectTile
        };

        if (this.search(x + 1, y, refId, data, type)) return true;

        if (this.search(x - 1, y, refId, data, type)) return true;

        if (this.search(x, y + 1, refId, data, type)) return true;

        if (this.search(x, y - 1, refId, data, type)) return true;

        return false;
    }

    public push(type: Opcodes.Push, info: WorldPacket | WorldPacket[]): void {
        if (_.isArray(info)) {
            _.each(info, (i) => {
                this.push(type, i);
            });

            return;
        }

        if (!info.message) {
            log.info('No message found whilst attempting to push.');
            log.info(info);
            return;
        }

        switch (type) {
            case Opcodes.Push.Broadcast:
                this.network.pushBroadcast(info.message);

                break;

            case Opcodes.Push.Selectively:
                this.network.pushSelectively(info.message, info.ignores as string[]);

                break;

            case Opcodes.Push.Player:
                this.network.pushToPlayer(info.player as Player, info.message);

                break;

            case Opcodes.Push.Players:
                this.network.pushToPlayers(info.players as string[], info.message);

                break;

            case Opcodes.Push.Region:
                this.network.pushToRegion(
                    info.regionId as string,
                    info.message,
                    info.ignoreId as string
                );

                break;

            case Opcodes.Push.Regions:
                this.network.pushToAdjacentRegions(
                    info.regionId as string,
                    info.message,
                    info.ignoreId as string
                );

                break;

            case Opcodes.Push.NameArray:
                this.network.pushToNameArray(info.names as string[], info.message);

                break;

            case Opcodes.Push.OldRegions:
                this.network.pushToOldRegions(info.player as Player, info.message);

                break;
        }
    }

    public globalMessage(
        source: string,
        message: string,
        colour?: string,
        isGlobal = false,
        withBubble = false
    ): void {
        this.push(Opcodes.Push.Broadcast, {
            message: new Messages.Chat({
                name: source,
                text: message,
                colour,
                isGlobal,
                withBubble
            })
        });
    }

    public cleanCombat(character: Character): void {
        this.entities.forEachEntity((entity: Entity) => {
            if (entity.instance !== character.instance) return;

            if (entity instanceof Character && entity.combat.hasAttacker(entity))
                entity.combat.removeAttacker(entity);
        });
    }

    public isOnline(username: string): boolean {
        return this.entities.isOnline(username);
    }

    public getPlayerByName(username: string): Player {
        return this.entities.getPlayer(username) as Player;
    }

    public isFull(): boolean {
        return this.getPopulation() >= this.maxPlayers;
    }

    public getGrids(): Grids {
        return this.map.grids;
    }

    public getPopulation(): number {
        return _.size(this.entities.players);
    }

    public onPlayerConnection(callback: PlayerConnectCallback): void {
        this.playerConnectCallback = callback;
    }

    public onPopulationChange(callback: () => void): void {
        this.populationCallback = callback;
    }
}
