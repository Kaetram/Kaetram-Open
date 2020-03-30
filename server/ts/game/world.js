"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var _ = require("underscore");
var config_1 = require("../../config");
var globalobjects_1 = require("../controllers/globalobjects");
var guilds_1 = require("../controllers/guilds");
var minigames_1 = require("../controllers/minigames");
var shops_1 = require("../controllers/shops");
var map_1 = require("../map/map");
var api_1 = require("../network/api");
var messages_1 = require("../network/messages");
var network_1 = require("../network/network");
var packets_1 = require("../network/packets");
var region_1 = require("../region/region");
var formulas_1 = require("../util/formulas");
var items_1 = require("../util/items");
var mobs_1 = require("../util/mobs");
var modules_1 = require("../util/modules");
var npcs_1 = require("../util/npcs");
var utils_1 = require("../util/utils");
var character_1 = require("./entity/character/character");
var mob_1 = require("./entity/character/mob/mob");
var npc_1 = require("./entity/npc/npc");
var chest_1 = require("./entity/objects/chest");
var item_1 = require("./entity/objects/item");
var projectile_1 = require("./entity/objects/projectile");
/**
 * The world where everything is handled and rendered.
 */
var World = /** @class */ (function () {
    function World(socket, database) {
        this.socket = socket;
        this.database = database;
        this.socket = socket;
        this.database = database;
        this.maxPlayers = config_1["default"].maxPlayers;
        this.updateTime = config_1["default"].updateTime;
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
    World.prototype.load = function (onWorldLoad) {
        var _this = this;
        console.info('************ World Information ***********');
        /**
         * The reason maps are loaded per each world is because
         * we can have slight modifications for each world if we want in the
         * future. Using region loading, we can just send the client
         * whatever new map we have created server sided. Cleaner and nicer.
         */
        this.map = new map_1["default"](this);
        this.map.isReady(function () {
            console.info('The map has been successfully loaded!');
            _this.loaded();
            _this.spawnChests();
            _this.spawnEntities();
            setTimeout(onWorldLoad, 100);
        });
    };
    World.prototype.loaded = function () {
        /**
         * The following are all globally based 'plugins'. We load them
         * in a batch here in order to keep it organized and neat.
         */
        if (config_1["default"].enableAPI)
            this.api = new api_1["default"](this);
        this.shops = new shops_1["default"](this);
        this.region = new region_1["default"](this);
        this.network = new network_1["default"](this);
        this.minigames = new minigames_1["default"](this);
        this.guilds = new guilds_1["default"](this);
        this.globalObjects = new globalobjects_1["default"](this);
        this.ready = true;
        this.tick();
        console.info('******************************************');
    };
    World.prototype.tick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var update, setIntervalAsync;
            var _this = this;
            return __generator(this, function (_a) {
                update = 1000 / this.updateTime;
                setIntervalAsync = function (fn, ms) {
                    fn().then(function () {
                        setTimeout(function () { return setIntervalAsync(fn, ms); }, ms);
                    });
                };
                setIntervalAsync(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        this.network.parsePackets();
                        this.region.parseRegions();
                        return [2 /*return*/];
                    });
                }); }, update);
                return [2 /*return*/];
            });
        });
    };
    /** **************************
     * Entity related functions *
     *************************** */
    World.prototype.kill = function (entity) {
        entity.applyDamage(entity.hitPoints);
        this.push(packets_1["default"].PushOpcode.Regions, [
            {
                regionId: entity.region,
                message: new messages_1["default"].Points({
                    id: entity.instance,
                    hitPoints: entity.getHitPoints(),
                    mana: null
                })
            },
            {
                regionId: entity.region,
                message: new messages_1["default"].Despawn(entity.instance)
            }
        ]);
        this.handleDeath(entity, true);
    };
    World.prototype.handleDamage = function (attacker, target, damage) {
        if (!attacker || !target || isNaN(damage) || target.invincible)
            return;
        if (target.type === 'player' && target.hitCallback)
            target.hitCallback(attacker, damage);
        // Stop screwing with this - it's so the target retaliates.
        target.hit(attacker);
        target.applyDamage(damage, attacker);
        this.push(packets_1["default"].PushOpcode.Regions, {
            regionId: target.region,
            message: new messages_1["default"].Points({
                id: target.instance,
                hitPoints: target.getHitPoints(),
                mana: null
            })
        });
        // If target has died...
        if (target.getHitPoints() < 1) {
            if (target.type === 'mob')
                attacker.addExperience(mobs_1["default"].getXp(target.id));
            if (attacker.type === 'player')
                attacker.killCharacter(target);
            target.combat.forEachAttacker(function (attacker) {
                attacker.removeTarget();
            });
            this.push(packets_1["default"].PushOpcode.Regions, [
                {
                    regionId: target.region,
                    message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Finish, {
                        attackerId: attacker.instance,
                        targetId: target.instance
                    })
                },
                {
                    regionId: target.region,
                    message: new messages_1["default"].Despawn(target.instance)
                }
            ]);
            this.handleDeath(target, false, attacker);
        }
    };
    World.prototype.handleDeath = function (character, ignoreDrops, lastAttacker) {
        if (!character)
            return;
        if (character.type === 'mob') {
            var deathX = character.x;
            var deathY = character.y;
            if (lastAttacker)
                character.lastAttacker = lastAttacker;
            if (character.deathCallback)
                character.deathCallback();
            this.removeEntity(character);
            character.dead = true;
            character.destroy();
            character.combat.stop();
            if (!ignoreDrops) {
                var drop = character.getDrop();
                if (drop)
                    this.dropItem(drop.id, drop.count, deathX, deathY);
            }
        }
        else if (character.type === 'player')
            character.die();
    };
    World.prototype.createProjectile = function (info) {
        var attacker = info.shift();
        var target = info.shift();
        if (!attacker || !target)
            return null;
        var startX = attacker.x;
        var startY = attacker.y;
        var type = attacker.getProjectile();
        var hit = null;
        var projectile = new projectile_1["default"](type, utils_1["default"].generateInstance(5, type, startX + startY));
        projectile.setStart(startX, startY);
        projectile.setTarget(target);
        if (attacker.type === 'player')
            hit = attacker.getHit(target);
        projectile.damage = hit
            ? hit.damage
            : formulas_1["default"].getDamage(attacker, target, true);
        projectile.hitType = hit ? hit.type : modules_1["default"].Hits.Damage;
        projectile.owner = attacker;
        this.addProjectile(projectile, projectile.owner.region);
        return projectile;
    };
    World.prototype.getEntityByInstance = function (instance) {
        if (instance in this.entities)
            return this.entities[instance];
    };
    World.prototype.spawnEntities = function () {
        var _this = this;
        var entities = 0;
        _.each(this.map.staticEntities, function (data) {
            var key = data.string;
            var isMob = !!mobs_1["default"].Properties[key];
            var isNpc = !!npcs_1["default"].Properties[key];
            var isItem = !!items_1["default"].Data[key];
            var info = isMob
                ? mobs_1["default"].Properties[key]
                : isNpc
                    ? npcs_1["default"].Properties[key]
                    : isItem
                        ? items_1["default"].getData(key)
                        : null;
            var position = _this.map.indexToGridPosition(data.tileIndex);
            position.x++;
            if (!info || info === 'null') {
                if (_this.debug)
                    console.info("Unknown object spawned at: " + position.x + " " + position.y);
                return;
            }
            var instance = utils_1["default"].generateInstance(isMob ? 2 : isNpc ? 3 : 4, info.id + entities, position.x + entities, position.y);
            if (isMob) {
                var mob_2 = new mob_1["default"](info.id, instance, position.x, position.y, _this);
                mob_2.static = true;
                if (data.roaming)
                    mob_2.roaming = true;
                if (data.miniboss)
                    mob_2.miniboss = data.miniboss;
                if (data.boss)
                    mob_2.boss = data.boss;
                if (mobs_1["default"].Properties[key].hiddenName)
                    mob_2.hiddenName = mobs_1["default"].Properties[key].hiddenName;
                mob_2.load();
                mob_2.onRespawn(function () {
                    mob_2.dead = false;
                    mob_2.lastAttacker = null;
                    mob_2.refresh();
                    _this.addMob(mob_2);
                });
                _this.addMob(mob_2);
            }
            if (isNpc)
                _this.addNPC(new npc_1["default"](info.id, instance, position.x, position.y));
            if (isItem) {
                var item = _this.createItem(info.id, instance, position.x, position.y);
                item.static = true;
                _this.addItem(item);
            }
            entities++;
        });
        console.info("Spawned " + Object.keys(this.entities).length + " entities!");
    };
    World.prototype.spawnChests = function () {
        var _this = this;
        var chests = 0;
        _.each(this.map.chests, function (info) {
            _this.spawnChest(info.i, info.x, info.y, true);
            chests++;
        });
        console.info("Spawned " + Object.keys(this.chests).length + " static chests");
    };
    World.prototype.spawnMob = function (id, x, y) {
        var instance = utils_1["default"].generateInstance(2, id, x + id, y);
        var mob = new mob_1["default"](id, instance, x, y);
        if (!mobs_1["default"].exists(id))
            return;
        this.addMob(mob);
        return mob;
    };
    World.prototype.spawnChest = function (items, x, y, staticChest) {
        var _this = this;
        var chestCount = Object.keys(this.chests).length;
        var instance = utils_1["default"].generateInstance(5, 194 + chestCount, x, y);
        var chest = new chest_1["default"](194, instance, x, y);
        chest.items = items;
        if (staticChest) {
            chest.static = staticChest;
            chest.onRespawn(this.addChest.bind(this, chest));
        }
        chest.onOpen(function () {
            /**
             * Pretty simple concept, detect when the player opens the chest
             * then remove it and drop an item instead. Give it a 25 second
             * cooldown prior to respawning and voila.
             */
            _this.removeChest(chest);
            if (config_1["default"].debug)
                console.info("Opening chest at x: " + chest.x + ", y: " + chest.y);
            var item = chest.getItem();
            if (!item)
                return;
            _this.dropItem(items_1["default"].stringToId(item.string), item.count, chest.x, chest.y);
        });
        this.addChest(chest);
        return chest;
    };
    World.prototype.createItem = function (id, instance, x, y, ability, abilityLevel) {
        return new item_1["default"](id, instance, x, y, ability, abilityLevel);
    };
    World.prototype.dropItem = function (id, count, x, y, ability, abilityLevel) {
        var _this = this;
        var instance = utils_1["default"].generateInstance(4, id + Object.keys(this.entities).length, x, y);
        var item = this.createItem(id, instance, x, y, ability, abilityLevel);
        item.count = count;
        item.dropped = true;
        this.addItem(item);
        item.despawn();
        if (config_1["default"].debug) {
            console.info("Item - " + id + " has been dropped at x: " + x + ", y: " + y + ".");
            console.info("Item Region - " + item.region);
        }
        item.onBlink(function () {
            _this.push(packets_1["default"].PushOpcode.Broadcast, {
                message: new messages_1["default"].Blink(item.instance)
            });
        });
        item.onDespawn(function () {
            _this.removeItem(item);
        });
    };
    World.prototype.push = function (type, info) {
        var _this = this;
        if (_.isArray(info)) {
            _.each(info, function (i) {
                _this.push(type, i);
            });
            return;
        }
        if (!info.message) {
            console.info('No message found whilst attempting to push.');
            console.info(info);
            return;
        }
        switch (type) {
            case packets_1["default"].PushOpcode.Broadcast:
                this.network.pushBroadcast(info.message);
                break;
            case packets_1["default"].PushOpcode.Selectively:
                this.network.pushSelectively(info.message, info.ignores);
                break;
            case packets_1["default"].PushOpcode.Player:
                this.network.pushToPlayer(info.player, info.message);
                break;
            case packets_1["default"].PushOpcode.Players:
                this.network.pushToPlayers(info.players, info.message);
                break;
            case packets_1["default"].PushOpcode.Region:
                this.network.pushToRegion(info.regionId, info.message, info.ignoreId);
                break;
            case packets_1["default"].PushOpcode.Regions:
                this.network.pushToAdjacentRegions(info.regionId, info.message, info.ignoreId);
                break;
            case packets_1["default"].PushOpcode.NameArray:
                this.network.pushToNameArray(info.names, info.message);
                break;
            case packets_1["default"].PushOpcode.OldRegions:
                this.network.pushToOldRegions(info.player, info.message);
                break;
        }
    };
    World.prototype.addEntity = function (entity, region) {
        var _this = this;
        if (entity.instance in this.entities)
            console.info("Entity " + entity.instance + " already exists.");
        this.entities[entity.instance] = entity;
        if (entity.type !== 'projectile')
            this.region.handle(entity, region);
        if (entity.x > 0 && entity.y > 0)
            this.getGrids().addToEntityGrid(entity, entity.x, entity.y);
        entity.onSetPosition(function () {
            _this.getGrids().updateEntityPosition(entity);
            if (entity.isMob() && entity.isOutsideSpawn()) {
                entity.removeTarget();
                entity.combat.forget();
                entity.combat.stop();
                entity["return"]();
                _this.push(packets_1["default"].PushOpcode.Broadcast, [
                    {
                        message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Finish, {
                            attackerId: null,
                            targetId: entity.instance
                        })
                    },
                    {
                        message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Move, {
                            id: entity.instance,
                            x: entity.x,
                            y: entity.y,
                            forced: false,
                            teleport: false
                        })
                    }
                ]);
            }
        });
        if (entity instanceof character_1["default"]) {
            entity.getCombat().setWorld(this);
            entity.onStunned(function (stun) {
                _this.push(packets_1["default"].PushOpcode.Regions, {
                    regionId: entity.region,
                    message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Stunned, {
                        id: entity.instance,
                        state: stun
                    })
                });
            });
        }
    };
    World.prototype.addPlayer = function (player) {
        this.addEntity(player);
        this.players[player.instance] = player;
        if (this.populationCallback)
            this.populationCallback();
    };
    World.prototype.addNPC = function (npc, region) {
        this.addEntity(npc, region);
        this.npcs[npc.instance] = npc;
    };
    World.prototype.addMob = function (mob, region) {
        if (!mobs_1["default"].exists(mob.id)) {
            console.error("Cannot spawn mob. " + mob.id + " does not exist.");
            return;
        }
        this.addEntity(mob, region);
        this.mobs[mob.instance] = mob;
        mob.addToChestArea(this.getChestAreas());
        mob.onHit(function (attacker) {
            if (mob.isDead() || mob.combat.started)
                return;
            mob.combat.begin(attacker);
        });
    };
    World.prototype.addItem = function (item, region) {
        if (item.static)
            item.onRespawn(this.addItem.bind(this, item));
        this.addEntity(item, region);
        this.items[item.instance] = item;
    };
    World.prototype.addProjectile = function (projectile, region) {
        this.addEntity(projectile, region);
        this.projectiles[projectile.instance] = projectile;
    };
    World.prototype.addChest = function (chest, region) {
        this.addEntity(chest, region);
        this.chests[chest.instance] = chest;
    };
    World.prototype.removeEntity = function (entity) {
        if (entity.instance in this.entities)
            delete this.entities[entity.instance];
        if (entity.instance in this.mobs)
            delete this.mobs[entity.instance];
        if (entity.instance in this.items)
            delete this.items[entity.instance];
        this.getGrids().removeFromEntityGrid(entity, entity.x, entity.y);
        this.region.remove(entity);
    };
    World.prototype.cleanCombat = function (entity) {
        _.each(this.entities, function (oEntity) {
            if (oEntity instanceof character_1["default"] &&
                oEntity.combat.hasAttacker(entity))
                oEntity.combat.removeAttacker(entity);
        });
    };
    World.prototype.removeItem = function (item) {
        this.removeEntity(item);
        this.push(packets_1["default"].PushOpcode.Broadcast, {
            message: new messages_1["default"].Despawn(item.instance)
        });
        if (item.static)
            item.respawn();
    };
    World.prototype.removePlayer = function (player) {
        this.push(packets_1["default"].PushOpcode.Regions, {
            regionId: player.region,
            message: new messages_1["default"].Despawn(player.instance)
        });
        if (player.ready)
            player.save();
        if (this.populationCallback)
            this.populationCallback();
        this.removeEntity(player);
        this.cleanCombat(player);
        if (player.isGuest)
            this.database["delete"](player);
        delete this.players[player.instance];
        delete this.network.packets[player.instance];
    };
    World.prototype.removeProjectile = function (projectile) {
        this.removeEntity(projectile);
        delete this.projectiles[projectile.instance];
    };
    World.prototype.removeChest = function (chest) {
        this.removeEntity(chest);
        this.push(packets_1["default"].PushOpcode.Broadcast, {
            message: new messages_1["default"].Despawn(chest.instance)
        });
        if (chest.static)
            chest.respawn();
        else
            delete this.chests[chest.instance];
    };
    World.prototype.playerInWorld = function (username) {
        for (var id in this.players)
            if (this.players.hasOwnProperty(id))
                if (this.players[id].username.toLowerCase() ===
                    username.toLowerCase())
                    return true;
        return false;
    };
    World.prototype.getPlayerByName = function (name) {
        for (var id in this.players)
            if (this.players.hasOwnProperty(id))
                if (this.players[id].username.toLowerCase() ===
                    name.toLowerCase())
                    return this.players[id];
        return null;
    };
    World.prototype.isFull = function () {
        return this.getPopulation() >= this.maxPlayers;
    };
    World.prototype.getPlayerByInstance = function (instance) {
        if (instance in this.players)
            return this.players[instance];
        return null;
    };
    World.prototype.forEachPlayer = function (callback) {
        _.each(this.players, function (player) {
            callback(player);
        });
    };
    World.prototype.getPVPAreas = function () {
        return this.map.areas.PVP.pvpAreas;
    };
    World.prototype.getMusicAreas = function () {
        return this.map.areas.Music.musicAreas;
    };
    World.prototype.getChestAreas = function () {
        return this.map.areas.Chests.chestAreas;
    };
    World.prototype.getOverlayAreas = function () {
        return this.map.areas.Overlays.overlayAreas;
    };
    World.prototype.getCameraAreas = function () {
        return this.map.areas.Cameras.cameraAreas;
    };
    World.prototype.getGrids = function () {
        return this.map.grids;
    };
    World.prototype.getPopulation = function () {
        return _.size(this.players);
    };
    World.prototype.onPlayerConnection = function (callback) {
        this.playerConnectCallback = callback;
    };
    World.prototype.onPopulationChange = function (callback) {
        this.populationCallback = callback;
    };
    return World;
}());
exports["default"] = World;
