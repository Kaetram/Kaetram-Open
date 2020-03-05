import _ from 'underscore';
import config from '../../config.json';
import GlobalObjects from '../controllers/globalobjects';
import Guilds from '../controllers/guilds';
import Minigames from '../controllers/minigames';
import Shops from '../controllers/shops';
import MongoDB from '../database/mongodb/mongodb';
import Map from '../map/map';
import API from '../network/api';
import Messages from '../network/messages';
import Network from '../network/network';
import Packets from '../network/packets';
import Socket from '../network/socket';
import Region from '../region/region';
import Formulas from '../util/formulas';
import Items from '../util/items';
import Mobs from '../util/mobs';
import Modules from '../util/modules';
import NPCs from '../util/npcs';
import Utils from '../util/utils';
import Character from './entity/character/character';
import Mob from './entity/character/mob/mob';
import Player from './entity/character/player/player';
import Entity from './entity/entity';
import NPC from './entity/npc/npc';
import Chest from './entity/objects/chest';
import Item from './entity/objects/item';
import Projectile from './entity/objects/projectile';

class World {
    public entities: { [key: string]: Entity };
    public maxPlayers: number;
    public players: { [key: string]: Player };
    public map: Map;
    public playerConnectCallback: Function;
    public populationCallback: Function;
    public api: API;
    public shops: Shops;
    public region: Region;
    public network: Network;
    public minigames: Minigames;
    public guilds: Guilds;
    public globalObjects: GlobalObjects;
    public ready: boolean;
    public updateTime: number;
    public debug: boolean;
    public chests: { [key: string]: Chest };
    public npcs: { [key: string]: NPC };
    public mobs: { [key: string]: Mob };
    public items: { [key: string]: Item };
    public projectiles: { [key: string]: Projectile };
    public allowConnections: boolean;
    public loadedRegions: boolean;

    constructor(public socket: Socket, public database: MongoDB) {
        this.socket = socket;
        this.database = database;

        this.maxPlayers = config.maxPlayers;
        this.updateTime = config.updateTime;

        this.debug = false;
        this.allowConnections = false;

        this.players = {};
        this.entities = {};
        this.items = {};
        this.chests = {};
        this.mobs = {};
        this.npcs = {};
        this.projectiles = {};

        this.loadedRegions = false;

        this.ready = false;
    }

    load(onWorldLoad) {
        console.info('************ World Information ***********');

        /**
         * The reason maps are loaded per each world is because
         * we can have slight modifications for each world if we want in the
         * future. Using region loading, we can just send the client
         * whatever new map we have created server sided. Cleaner and nicer.
         */

        this.map = new Map(this);
        this.map.isReady(() => {
            console.info('The map has been successfully loaded!');

            this.loaded();

            this.spawnChests();
            this.spawnEntities();

            setTimeout(onWorldLoad, 100);
        });
    }

    loaded() {
        /**
         * The following are all globally based 'plugins'. We load them
         * in a batch here in order to keep it organized and neat.
         */

        if (config.enableAPI) this.api = new API(this);

        this.shops = new Shops(this);
        this.region = new Region(this);
        this.network = new Network(this);
        this.minigames = new Minigames(this);
        this.guilds = new Guilds(this);
        this.globalObjects = new GlobalObjects(this);

        this.ready = true;

        this.tick();

        console.info('******************************************');
    }

    async tick() {
        const update = 1000 / this.updateTime;

        const setIntervalAsync = (fn, ms) => {
            fn().then(() => {
                setTimeout(() => setIntervalAsync(fn, ms), ms);
            });
        };

        setIntervalAsync(async () => {
            this.network.parsePackets();
            this.region.parseRegions();
        }, update);
    }

    /****************************
     * Entity related functions *
     ****************************/

    kill(entity) {
        entity.applyDamage(entity.hitPoints);

        this.push(Packets.PushOpcode.Regions, [
            {
                regionId: entity.region,
                message: new Messages.Points({
                    id: entity.instance,
                    hitPoints: entity.getHitPoints(),
                    mana: null
                })
            },
            {
                regionId: entity.region,
                message: new Messages.Despawn(entity.instance)
            }
        ]);

        this.handleDeath(entity, true);
    }

    handleDamage(attacker, target, damage) {
        if (!attacker || !target || isNaN(damage) || target.invincible) return;

        if (target.type === 'player' && target.hitCallback)
            target.hitCallback(attacker, damage);

        // Stop screwing with this - it's so the target retaliates.

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
            if (target.type === 'mob')
                attacker.addExperience(Mobs.getXp(target.id));

            if (attacker.type === 'player') attacker.killCharacter(target);

            target.combat.forEachAttacker(attacker => {
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

    handleDeath(character, ignoreDrops?, lastAttacker?) {
        if (!character) return;

        if (character.type === 'mob') {
            const deathX = character.x;
            const deathY = character.y;

            if (lastAttacker) character.lastAttacker = lastAttacker;

            if (character.deathCallback) character.deathCallback();

            this.removeEntity(character);

            character.dead = true;

            character.destroy();

            character.combat.stop();

            if (!ignoreDrops) {
                const drop = character.getDrop();

                if (drop) this.dropItem(drop.id, drop.count, deathX, deathY);
            }
        } else if (character.type === 'player') character.die();
    }

    createProjectile(info) {
        const attacker = info.shift();
        const target = info.shift();

        if (!attacker || !target) return null;

        const startX = attacker.x;
        const startY = attacker.y;
        const type = attacker.getProjectile();
        let hit = null;
        const projectile = new Projectile(
            type,
            Utils.generateInstance(5, type, startX + startY)
        );

        projectile.setStart(startX, startY);
        projectile.setTarget(target);

        if (attacker.type === 'player') hit = attacker.getHit(target);

        projectile.damage = hit
            ? hit.damage
            : Formulas.getDamage(attacker, target, true);
        projectile.hitType = hit ? hit.type : Modules.Hits.Damage;

        projectile.owner = attacker;

        this.addProjectile(projectile, projectile.owner.region);

        return projectile;
    }

    getEntityByInstance(instance) {
        if (instance in this.entities) return this.entities[instance];
    }

    spawnEntities() {
        let entities = 0;

        _.each(this.map.staticEntities, (data: any) => {
            const key = data.string;
            const isMob = !!Mobs.Properties[key];
            const isNpc = !!NPCs.Properties[key];
            const isItem = !!Items.Data[key];
            const info = isMob
                ? Mobs.Properties[key]
                : isNpc
                ? NPCs.Properties[key]
                : isItem
                ? Items.getData(key)
                : null;
            const position = this.map.indexToGridPosition(data.tileIndex);

            position.x++;

            if (!info || info === 'null') {
                if (this.debug)
                    console.info(
                        'Unknown object spawned at: ' +
                            position.x +
                            ' ' +
                            position.y
                    );

                return;
            }

            const instance = Utils.generateInstance(
                isMob ? 2 : isNpc ? 3 : 4,
                info.id + entities,
                position.x + entities,
                position.y
            );

            if (isMob) {
                const mob = new Mob(
                    info.id,
                    instance,
                    position.x,
                    position.y,
                    this
                );

                mob.static = true;

                if (data.roaming) mob.roaming = true;

                if (data.miniboss) mob.miniboss = data.miniboss;

                if (data.boss) mob.boss = data.boss;

                if (Mobs.Properties[key].hiddenName)
                    mob.hiddenName = Mobs.Properties[key].hiddenName;

                mob.load();

                mob.onRespawn(() => {
                    mob.dead = false;

                    mob.lastAttacker = null;

                    mob.refresh();

                    this.addMob(mob);
                });

                this.addMob(mob);
            }

            if (isNpc)
                this.addNPC(new NPC(info.id, instance, position.x, position.y));

            if (isItem) {
                const item = this.createItem(
                    info.id,
                    instance,
                    position.x,
                    position.y
                );

                item.static = true;
                this.addItem(item);
            }

            entities++;
        });

        console.info(
            'Spawned ' + Object.keys(this.entities).length + ' entities!'
        );
    }

    spawnChests() {
        let chests = 0;

        _.each(this.map.chests, (info: any) => {
            this.spawnChest(info.i, info.x, info.y, true);

            chests++;
        });

        console.info(
            'Spawned ' + Object.keys(this.chests).length + ' static chests'
        );
    }

    spawnMob(id, x, y) {
        const instance = Utils.generateInstance(2, id, x + id, y);
        const mob = new Mob(id, instance, x, y);

        if (!Mobs.exists(id)) return;

        this.addMob(mob);

        return mob;
    }

    spawnChest(items, x, y, staticChest) {
        const chestCount = Object.keys(this.chests).length;
        const instance = Utils.generateInstance(5, 194 + chestCount, x, y);
        const chest = new Chest(194, instance, x, y);

        chest.items = items;

        if (staticChest) {
            chest.static = staticChest;

            chest.onRespawn(this.addChest.bind(this, chest));
        }

        chest.onOpen(() => {
            /**
             * Pretty simple concept, detect when the player opens the chest
             * then remove it and drop an item instead. Give it a 25 second
             * cooldown prior to respawning and voila.
             */

            this.removeChest(chest);

            if (config.debug)
                console.info(`Opening chest at x: ${chest.x}, y: ${chest.y}`);

            const item = chest.getItem();

            if (!item) return;

            this.dropItem(
                Items.stringToId(item.string),
                item.count,
                chest.x,
                chest.y
            );
        });

        this.addChest(chest);

        return chest;
    }

    createItem(id, instance, x, y, ability?, abilityLevel?) {
        return new Item(id, instance, x, y, ability, abilityLevel);
    }

    dropItem(id, count, x, y, ability?, abilityLevel?) {
        const instance = Utils.generateInstance(
            4,
            id + Object.keys(this.entities).length,
            x,
            y
        );
        const item = this.createItem(id, instance, x, y, ability, abilityLevel);

        item.count = count;
        item.dropped = true;

        this.addItem(item);
        item.despawn();

        if (config.debug) {
            console.info(`Item - ${id} has been dropped at x: ${x}, y: ${y}.`);

            console.info(`Item Region - ${item.region}`);
        }

        item.onBlink(() => {
            this.push(Packets.PushOpcode.Broadcast, {
                message: new Messages.Blink(item.instance)
            });
        });

        item.onDespawn(() => {
            this.removeItem(item);
        });
    }

    push(type, info) {
        if (_.isArray(info)) {
            _.each(info, i => {
                this.push(type, i);
            });

            return;
        }

        if (!info.message) {
            console.info('No message found whilst attempting to push.');

            console.info(info);

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
                this.network.pushToRegion(
                    info.regionId,
                    info.message,
                    info.ignoreId
                );

                break;

            case Packets.PushOpcode.Regions:
                this.network.pushToAdjacentRegions(
                    info.regionId,
                    info.message,
                    info.ignoreId
                );

                break;

            case Packets.PushOpcode.NameArray:
                this.network.pushToNameArray(info.names, info.message);

                break;

            case Packets.PushOpcode.OldRegions:
                this.network.pushToOldRegions(info.player, info.message);

                break;
        }
    }

    addEntity(entity, region?) {
        if (entity.instance in this.entities)
            console.info('Entity ' + entity.instance + ' already exists.');

        this.entities[entity.instance] = entity;

        if (entity.type !== 'projectile') this.region.handle(entity, region);

        if (entity.x > 0 && entity.y > 0)
            this.getGrids().addToEntityGrid(entity, entity.x, entity.y);

        entity.onSetPosition(() => {
            this.getGrids().updateEntityPosition(entity);

            if (entity.isMob() && entity.isOutsideSpawn()) {
                entity.removeTarget();
                entity.combat.forget();
                entity.combat.stop();

                entity.return();

                this.push(Packets.PushOpcode.Broadcast, [
                    {
                        message: new Messages.Combat(
                            Packets.CombatOpcode.Finish,
                            {
                                attackerId: null,
                                targetId: entity.instance
                            }
                        )
                    },
                    {
                        message: new Messages.Movement(
                            Packets.MovementOpcode.Move,
                            {
                                id: entity.instance,
                                x: entity.x,
                                y: entity.y,
                                forced: false,
                                teleport: false
                            }
                        )
                    }
                ]);
            }
        });

        if (entity instanceof Character) {
            entity.getCombat().setWorld(this);

            entity.onStunned(stun => {
                this.push(Packets.PushOpcode.Regions, {
                    regionId: entity.region,
                    message: new Messages.Movement(
                        Packets.MovementOpcode.Stunned,
                        {
                            id: entity.instance,
                            state: stun
                        }
                    )
                });
            });
        }
    }

    addPlayer(player) {
        this.addEntity(player);
        this.players[player.instance] = player;

        if (this.populationCallback) this.populationCallback();
    }

    addNPC(npc, region?) {
        this.addEntity(npc, region);
        this.npcs[npc.instance] = npc;
    }

    addMob(mob, region?) {
        if (!Mobs.exists(mob.id)) {
            console.error('Cannot spawn mob. ' + mob.id + ' does not exist.');

            return;
        }

        this.addEntity(mob, region);
        this.mobs[mob.instance] = mob;

        mob.addToChestArea(this.getChestAreas());

        mob.onHit(attacker => {
            if (mob.isDead() || mob.combat.started) return;

            mob.combat.begin(attacker);
        });
    }

    addItem(item, region?) {
        if (item.static) item.onRespawn(this.addItem.bind(this, item));

        this.addEntity(item, region);
        this.items[item.instance] = item;
    }

    addProjectile(projectile, region) {
        this.addEntity(projectile, region);
        this.projectiles[projectile.instance] = projectile;
    }

    addChest(chest, region?) {
        this.addEntity(chest, region);
        this.chests[chest.instance] = chest;
    }

    removeEntity(entity) {
        if (entity.instance in this.entities)
            delete this.entities[entity.instance];

        if (entity.instance in this.mobs) delete this.mobs[entity.instance];

        if (entity.instance in this.items) delete this.items[entity.instance];

        this.getGrids().removeFromEntityGrid(entity, entity.x, entity.y);

        this.region.remove(entity);
    }

    cleanCombat(entity) {
        _.each(this.entities, oEntity => {
            if (
                oEntity instanceof Character &&
                oEntity.combat.hasAttacker(entity)
            )
                oEntity.combat.removeAttacker(entity);
        });
    }

    removeItem(item) {
        this.removeEntity(item);
        this.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Despawn(item.instance)
        });

        if (item.static) item.respawn();
    }

    removePlayer(player) {
        this.push(Packets.PushOpcode.Regions, {
            regionId: player.region,
            message: new Messages.Despawn(player.instance)
        });

        if (player.ready) player.save();

        if (this.populationCallback) this.populationCallback();

        this.removeEntity(player);

        this.cleanCombat(player);

        if (player.isGuest) this.database.delete(player);

        delete this.players[player.instance];
        delete this.network.packets[player.instance];
    }

    removeProjectile(projectile) {
        this.removeEntity(projectile);

        delete this.projectiles[projectile.instance];
    }

    removeChest(chest) {
        this.removeEntity(chest);
        this.push(Packets.PushOpcode.Broadcast, {
            message: new Messages.Despawn(chest.instance)
        });

        if (chest.static) chest.respawn();
        else delete this.chests[chest.instance];
    }

    playerInWorld(username) {
        for (const id in this.players)
            if (this.players.hasOwnProperty(id))
                if (
                    this.players[id].username.toLowerCase() ===
                    username.toLowerCase()
                )
                    return true;

        return false;
    }

    getPlayerByName(name) {
        for (const id in this.players)
            if (this.players.hasOwnProperty(id))
                if (
                    this.players[id].username.toLowerCase() ===
                    name.toLowerCase()
                )
                    return this.players[id];

        return null;
    }

    isFull() {
        return this.getPopulation() >= this.maxPlayers;
    }

    getPlayerByInstance(instance) {
        if (instance in this.players) return this.players[instance];

        return null;
    }

    forEachPlayer(callback) {
        _.each(this.players, player => {
            callback(player);
        });
    }

    getPVPAreas() {
        return this.map.areas.PVP.pvpAreas;
    }

    getMusicAreas() {
        return this.map.areas.Music.musicAreas;
    }

    getChestAreas() {
        return this.map.areas.Chests.chestAreas;
    }

    getOverlayAreas() {
        return this.map.areas.Overlays.overlayAreas;
    }

    getCameraAreas() {
        return this.map.areas.Cameras.cameraAreas;
    }

    getGrids() {
        return this.map.grids;
    }

    getPopulation() {
        return _.size(this.players);
    }

    onPlayerConnection(callback) {
        this.playerConnectCallback = callback;
    }

    onPopulationChange(callback) {
        this.populationCallback = callback;
    }
}

export default World;
