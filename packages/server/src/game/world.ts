import _ from 'lodash';

import log from '../util/log';

import config from '../../config';
import Discord from '../network/discord';
import Map from '../map/map';
import Messages from '../network/messages';
import Mobs from '../util/mobs';
import Character from './entity/character/character';
import Minigames from '../controllers/minigames';
import Packets from '../network/packets';
import Modules from '../util/modules';
import Shops from '../controllers/shops';
import Region from '../region/region';
import GlobalObjects from '../controllers/globalobjects';
import Network from '../network/network';
import Trees from '../../data/professions/trees';
import Rocks from '../../data/professions/rocks';
import Entity from './entity/entity';
import Entities from '../controllers/entities';
import SocketHandler from '../network/sockethandler';
import MongoDB from '../database/mongodb/mongodb';
import API from '../network/api';

class World {
    public socketHandler: SocketHandler;
    public database: MongoDB;

    public maxPlayers: number;
    public updateTime: number;
    public debug: boolean;
    public allowConnections: boolean;

    public trees: { [key: string]: any };
    public cutTrees: { [key: string]: any };

    public rocks: { [key: string]: any };
    public depletedRocks: { [key: string]: any };

    public loadedRegions: boolean;
    public ready: boolean;

    public map: Map;
    public api: API;
    public shops: Shops;
    public region: Region;
    public entities: Entities;
    public network: Network;
    public discord: Discord;
    public minigames: Minigames;
    public globalObjects: GlobalObjects;

    public playerConnectCallback: Function;
    public populationCallback: Function;

    constructor(socketHandler: SocketHandler, database: MongoDB) {
        this.socketHandler = socketHandler;
        this.database = database;

        this.maxPlayers = config.maxPlayers;
        this.updateTime = config.updateTime;

        this.debug = false;
        this.allowConnections = false;

        // Lumberjacking Variables
        this.trees = {};
        this.cutTrees = {};

        // Mining Variables
        this.rocks = {};
        this.depletedRocks = {};

        this.loadedRegions = false;

        this.ready = false;
    }

    load(onWorldLoad: Function) {
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

    loaded() {
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

    async tick() {
        let update = 1000 / this.updateTime;

        const setIntervalAsync = (fn: any, ms: any) => {
            fn().then(() => {
                setTimeout(() => setIntervalAsync(fn, ms), ms);
            });
        };

        setIntervalAsync(async () => {
            this.network.parsePackets();
            this.region.parseRegions();
        }, update);

        setIntervalAsync(async () => {
            this.parseTrees();
        }, config.treeTick || 1000);

        if (!config.hubEnabled) return;

        if (!config.apiEnabled) log.warning('Server is in hub-mode but API is not enabled!');

        setIntervalAsync(async () => {
            this.api.pingHub();
        }, config.hubPing);
    }

    /****************************
     * Entity related functions *
     ****************************/

    kill(character: Character) {
        character.applyDamage(character.hitPoints);

        this.push(Packets.PushOpcode.Regions, [
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

    handleDamage(attacker: Character, target: Character, damage: number) {
        if (!attacker || !target || isNaN(damage) || target.invincible) return;

        if (target.type === 'player' && target.hitCallback) target.hitCallback(attacker, damage);

        //Stop screwing with this - it's so the target retaliates.

        target.hit(attacker);
        target.applyDamage(damage, attacker);

        this.push(Packets.PushOpcode.Regions, {
            regionId: target.region,
            message: new Messages.Points({
                id: target.instance,
                hitPoints: target.getHitPoints(),
                mana: null
            })
        });

        // If target has died...
        if (target.getHitPoints() < 1) {
            if (target.type === 'mob') attacker.addExperience(Mobs.getXp(target.id));

            if (attacker.type === 'player') attacker.killCharacter(target);

            target.combat.forEachAttacker((attacker: Character) => {
                attacker.removeTarget();
            });

            this.push(Packets.PushOpcode.Regions, [
                {
                    regionId: target.region,
                    message: new Messages.Combat(Packets.CombatOpcode.Finish, {
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

    handleDeath(character: Character, ignoreDrops?: boolean, lastAttacker?: Character) {
        if (!character) return;

        if (character.type === 'mob') {
            let deathX = character.x,
                deathY = character.y;

            if (lastAttacker) character.lastAttacker = lastAttacker;

            if (character.deathCallback) character.deathCallback();

            this.entities.remove(character);

            character.dead = true;

            character.destroy();

            character.combat.stop();

            if (!ignoreDrops) {
                let drop = character.getDrop();

                if (drop) this.entities.dropItem(drop.id, drop.count, deathX, deathY);
            }
        } else if (character.type === 'player') character.die();
    }

    parseTrees() {
        let time = new Date().getTime(),
            treeTypes = Object.keys(Modules.Trees);

        _.each(this.cutTrees, (tree, key) => {
            let type = treeTypes[tree.treeId];

            if (time - tree.time < Trees.Regrowth[type]) return;

            _.each(tree.data, (tile: any) => {
                this.map.data[tile.index] = tile.oldTiles;
            });

            let position = this.map.idToPosition(key),
                regionId = this.map.regions.regionIdFromPosition(position.x, position.y);

            this.region.updateRegions(regionId);

            delete this.cutTrees[key];
        });
    }

    parseRocks() {
        let time = new Date().getTime(),
            rockTypes = Object.keys(Modules.Rocks);

        _.each(this.depletedRocks, (rock, key) => {
            let type = rockTypes[rock.rockId];

            if (time - rock.time < Rocks.Respawn[type]) return;

            _.each(rock.data, (tile: any) => {
                this.map.data[tile.index] = tile.oldTiles;
            });

            let position = this.map.idToPosition(key),
                regionId = this.map.regions.regionIdFromPosition(position.x, position.y);

            this.region.updateRegions(regionId);

            delete this.depletedRocks[key];
        });
    }

    isTreeCut(id: string) {
        if (id in this.cutTrees) return true;

        for (let i in this.cutTrees) if (id in this.cutTrees[i]) return true;

        return false;
    }

    isRockDepleted(id: string) {
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

    destroyTree(id: any, treeId: any) {
        let position = this.map.idToPosition(id);

        if (!(id in this.trees)) this.trees[id] = {};

        this.search(position.x + 1, position.y, id, this.trees, 'tree');

        this.cutTrees[id] = {
            data: {},
            time: new Date().getTime(),
            treeId: treeId
        };

        _.each(this.trees[id], (tile: any, key) => {
            let tiles = this.map.data[tile.index];

            // Store the original tiles for respawning.
            this.cutTrees[id].data[key] = {
                oldTiles: [].concat(tiles), // concat to create a new array
                index: tile.index
            };

            // We do not remove tiles that do not have another tile behind them.
            if (tiles instanceof Array) {
                let index = tiles.indexOf(tile.objectTile);

                // We map the uncut trunk to the cut trunk tile.
                if (tile.objectTile in Trees.Stumps) tiles[index] = Trees.Stumps[tile.objectTile];
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
     * `refId` - The intial object we click on.
     * `data` - The array we are working with.
     * `type` - The type of tile we are looking for.
     */

    getSearchTile(type: string, x: number, y: number) {
        switch (type) {
            case 'tree':
                return this.map.getTree(x, y);

            case 'rock':
                return this.map.getRock(x, y);
        }
    }

    search(x: number, y: number, refId: any, data: any, type: string) {
        let objectTile = this.getSearchTile(type, x, y);

        if (!objectTile) return false;

        let id = x + '-' + y;

        if (id in data[refId]) return false;

        data[refId][id] = {
            index: this.map.gridPositionToIndex(x, y) - 1,
            objectTile: objectTile
        };

        if (this.search(x + 1, y, refId, data, type)) return true;

        if (this.search(x - 1, y, refId, data, type)) return true;

        if (this.search(x, y + 1, refId, data, type)) return true;

        if (this.search(x, y - 1, refId, data, type)) return true;

        return false;
    }

    push(type: number, info: any) {
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
            case Packets.PushOpcode.Broadcast:
                this.network.pushBroadcast(info.message);

                break;

            case Packets.PushOpcode.Selectively:
                this.network.pushSelectively(info.message, info.ignores);

                break;

            case Packets.PushOpcode.Player:
                this.network.pushToPlayer(info.player, info.message);

                break;

            case Packets.PushOpcode.Players:
                this.network.pushToPlayers(info.players, info.message);

                break;

            case Packets.PushOpcode.Region:
                this.network.pushToRegion(info.regionId, info.message, info.ignoreId);

                break;

            case Packets.PushOpcode.Regions:
                this.network.pushToAdjacentRegions(info.regionId, info.message, info.ignoreId);

                break;

            case Packets.PushOpcode.NameArray:
                this.network.pushToNameArray(info.names, info.message);

                break;

            case Packets.PushOpcode.OldRegions:
                this.network.pushToOldRegions(info.player, info.message);

                break;
        }
    }

    globalMessage(
        source: any,
        message: any,
        colour?: string,
        isGlobal?: boolean,
        withBubble?: boolean
    ) {
        this.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Chat({
                name: source,
                text: message,
                colour: colour,
                isGlobal: isGlobal,
                withBubble: withBubble
            })
        });
    }

    cleanCombat(character: Character) {
        this.entities.forEachEntity((entity: Entity) => {
            if (entity instanceof Character && entity.combat.hasAttacker(entity))
                entity.combat.removeAttacker(entity);
        });
    }

    isOnline(username: string) {
        return this.entities.isOnline(username);
    }

    getPlayerByName(username: string) {
        return this.entities.getPlayer(username);
    }

    isFull() {
        return this.getPopulation() >= this.maxPlayers;
    }
    
    getGrids() {
        return this.map.grids;
    }

    getPopulation() {
        return _.size(this.entities.players);
    }

    onPlayerConnection(callback: Function) {
        this.playerConnectCallback = callback;
    }

    onPopulationChange(callback: Function) {
        this.populationCallback = callback;
    }
}

export default World;
