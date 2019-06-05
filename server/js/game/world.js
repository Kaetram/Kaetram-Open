/* global module */

let config = require('../../config.json'),
    Player = require('./entity/character/player/player'),
    Map = require('../map/map'),
    _ = require('underscore'),
    Messages = require('../network/messages'),
    Utils = require('../util/utils'),
    Mobs = require('../util/mobs'),
    Mob = require('./entity/character/mob/mob'),
    NPCs = require('../util/npcs'),
    NPC = require('./entity/npc/npc'),
    Items = require('../util/items'),
    Item = require('./entity/objects/item'),
    Chest = require('./entity/objects/chest'),
    Character = require('./entity/character/character'),
    Projectile = require('./entity/objects/projectile'),
    Packets = require('../network/packets'),
    Formulas = require('../util/formulas'),
    Modules = require('../util/modules'),
    Shops = require('../controllers/shops'),
    Region = require('../region/region'),
    Network = require('../network/network');

class World {

    constructor(id, socket, database) {
        let self = this;

        self.id = id;
        self.socket = socket;
        self.database = database;

        self.playerCount = 0;

        self.maxPlayers = config.maxPlayers;
        self.updateTime = config.updateTime;

        self.debug = false;

        self.players = {};
        self.entities = {};
        self.items = {};
        self.chests = {};
        self.mobs = {};
        self.npcs = {};
        self.projectiles = {};

        self.loadedRegions = false;

        self.ready = false;

        self.malformTimeout = null;

    }

    load(onWorldLoad) {
        let self = this;

        log.info('************ World ' + self.id + ' ***********');

        /**
         * The reason maps are loaded per each world is because
         * we can have slight modifications for each world if we want in the
         * future. Using region loading, we can just send the client
         * whatever new map we have created server sided. Cleaner and nicer.
         */

        self.map = new Map(self);
        self.map.isReady(function() {

            log.info('The map has been successfully loaded!');

            self.loaded();

            self.spawnChests();
            self.spawnEntities();

            onWorldLoad();

        });

    }

    loaded() {
        let self = this;
        /**
         * Similar to Kaetram engine here, but it's loaded upon initialization
         * rather than being called from elsewhere.
         */

        self.shops = new Shops(self);
        self.region = new Region(self);
        self.network = new Network(self);

        self.ready = true;

        self.tick();

        log.info('********************************');
    }

    tick() {
        let self = this;

        setInterval(function() {

            self.network.parsePackets();
            self.region.parseRegions();

        }, 1000 / self.updateTime);
    }

    /****************************
     * Entity related functions *
     ****************************/

    kill(entity) {
        let self = this;

        entity.applyDamage(entity.hitPoints);

        self.network.pushToAdjacentRegions(entity.region, new Messages.Points({
            id: entity.instance,
            hitPoints: entity.getHitPoints(),
            mana: null
        }));

        self.network.pushToAdjacentRegions(entity.region, new Messages.Despawn(entity.instance));

        self.handleDeath(entity, true);
    }

    handleDamage(attacker, target, damage) {
        let self = this;

        if (!attacker || !target || isNaN(damage) || target.invincible)
            return;

        if (target.type === 'player' && target.hitCallback)
            target.hitCallback(attacker, damage);

        //Stop screwing with this - it's so the target retaliates.

        target.hit(attacker);
        target.applyDamage(damage);

        self.network.pushToAdjacentRegions(target.region, new Messages.Points({
            id: target.instance,
            hitPoints: target.getHitPoints(),
            mana: null
        }));

        // If target has died...
        if (target.getHitPoints() < 1) {

            if (attacker.type === 'player' || target.type === 'player') {
                if (target.type === 'mob')
                    attacker.addExperience(Mobs.getXp(target.id));

                if (attacker.type === 'player')
                    attacker.killCharacter(target);
            }


            target.combat.forEachAttacker(function(attacker) {
                attacker.removeTarget();
            });


            self.network.pushToAdjacentRegions(target.region, new Messages.Combat(Packets.CombatOpcode.Finish, {
                attackerId: attacker.instance,
                targetId: target.instance
            }));

            self.network.pushToAdjacentRegions(target.region, new Messages.Despawn(target.instance));
            self.handleDeath(target);
        }
    }

    handleDeath(character, ignoreDrops) {
        let self = this;

        if (!character)
            return;

        if (character.type === 'mob') {
            let deathX = character.x,
                deathY = character.y;

            if (character.deathCallback)
                character.deathCallback();

            self.removeEntity(character);

            character.dead = true;

            character.destroy();

            character.combat.stop();

            if (!ignoreDrops) {
                let drop = character.getDrop();

                if (drop)
                    self.dropItem(drop.id, drop.count, deathX, deathY);
            }

        } else if (character.type === 'player')
            character.die();
    }

    createProjectile(info) {
        let self = this,
            attacker = info.shift(),
            target = info.shift();

        if (!attacker || !target)
            return null;

        let startX = attacker.x,
            startY = attacker.y,
            type = attacker.getProjectile(),
            hit = null,
            projectile = new Projectile(type, Utils.generateInstance(5, type, startX + startY));

        projectile.setStart(startX, startY);
        projectile.setTarget(target);

        if (attacker.type === 'player')
            hit = attacker.getHit(target);

        projectile.damage = hit ? hit.damage : Formulas.getDamage(attacker, target, true);
        projectile.hitType = hit ? hit.type : Modules.Hits.Damage;

        projectile.owner = attacker;

        self.addProjectile(projectile, projectile.owner.region);

        return projectile;
    }

    getEntityByInstance(instance) {
        if (instance in this.entities)
            return this.entities[instance];
    }

    spawnEntities() {
        let self = this,
            entities = 0;

        _.each(self.map.staticEntities, function(key, tileIndex) {
            let isMob = !!Mobs.Properties[key],
                isNpc = !!NPCs.Properties[key],
                isItem = !!Items.Data[key],
                info = isMob ? Mobs.Properties[key] : (isNpc ? NPCs.Properties[key] : isItem ? Items.getData(key) : null),
                position = self.map.indexToGridPosition(tileIndex);

            position.x++;

            if (!info || info === 'null') {
                if (self.debug) log.info('Unknown object spawned at: ' + position.x + ' ' + position.y);

                return;
            }

            let instance = Utils.generateInstance(isMob ? 2 : (isNpc ? 3 : 4), info.id + entities, position.x + entities, position.y);

            if (isMob) {
                let mob = new Mob(info.id, instance, position.x, position.y);

                mob.static = true;

                if (Mobs.Properties[key].hiddenName)
                    mob.hiddenName = Mobs.Properties[key].hiddenName;

                mob.onRespawn(function() {

                    mob.dead = false;

                    mob.refresh();

                    self.addMob(mob);

                });

                self.addMob(mob);
            }

            if (isNpc)
                self.addNPC(new NPC(info.id, instance, position.x, position.y));

            if (isItem) {
                let item = self.createItem(info.id, instance, position.x, position.y);
                item.static = true;
                self.addItem(item);
            }


            entities++;
        });

        log.info('Spawned ' + Object.keys(self.entities).length + ' entities!');
    }

    spawnChests() {
        let self = this,
            chests = 0;

        _.each(self.map.chests, function(info) {

            self.spawnChest(info.i, info.x, info.y, true);

            chests++;
        });

        log.info('Spawned ' + Object.keys(self.chests).length + ' static chests');
    }

    spawnMob(id, x, y) {
        let self = this,
            instance = Utils.generateInstance(2, id, x + id, y),
            mob = new Mob(id, instance, x, y);

        if (!Mobs.exists(id))
            return;

        self.addMob(mob);

        return mob;
    }

    spawnChest(items, x, y, staticChest) {
        let self = this,
            chestCount = Object.keys(self.chests).length,
            instance = Utils.generateInstance(5, 194, chestCount, x, y),
            chest = new Chest(194, instance, x, y);

        chest.items = items;

        if (staticChest) {

            chest.static = staticChest;

            chest.onRespawn(self.addChest.bind(self, chest));

        }

        chest.onOpen(function() {

            /**
             * Pretty simple concept, detect when the player opens the chest
             * then remove it and drop an item instead. Give it a 25 second
             * cooldown prior to respawning and voila.
             */

            self.removeChest(chest);

            self.dropItem(Items.stringToId(chest.getItem()), 1, chest.x, chest.y);

        });

        self.addChest(chest);

        return chest;
    }

    createItem(id, instance, x, y) {
        let item;

        if (Items.hasPlugin(id))
            item = new (Items.isNewPlugin(id))(id, instance, x, y);
        else
            item = new Item(id, instance, x, y);

        return item;
    }

    dropItem(id, count, x, y) {
        let self = this,
            instance = Utils.generateInstance(4, id + (Object.keys(self.entities)).length, x, y),
            item = self.createItem(id, instance, x, y);

        item.count = count;
        item.dropped = true;

        self.addItem(item);
        item.despawn();

        item.onBlink(function() {
            self.network.pushBroadcast(new Messages.Blink(item.instance));
        });

        item.onDespawn(function() {
            self.removeItem(item);
        });
    }

    addEntity(entity, region) {
        let self = this;

        if (entity.instance in self.entities)
            log.info('Entity ' + entity.instance + ' already exists.');

        self.entities[entity.instance] = entity;

        if (entity.type !== 'projectile')
            self.region.handle(entity, region);

        if (entity.x > 0 && entity.y > 0)
            self.getGrids().addToEntityGrid(entity, entity.x, entity.y);

        entity.onSetPosition(function() {

            self.getGrids().updateEntityPosition(entity);

            if (entity.isMob() && entity.isOutsideSpawn()) {

                entity.removeTarget();
                entity.combat.forget();
                entity.combat.stop();

                entity.return();

                self.network.pushBroadcast(new Messages.Combat(Packets.CombatOpcode.Finish, {
                    attackerId: null,
                    targetId: entity.instance
                }));

                self.network.pushBroadcast(new Messages.Movement(Packets.MovementOpcode.Move, {
                    id: entity.instance,
                    x: entity.x,
                    y: entity.y,
                    forced: false,
                    teleport: false
                }));

            }

        });

        if (entity instanceof Character) {

            entity.getCombat().setWorld(self);

            entity.onStunned(function(stun) {

                self.network.pushToAdjacentRegions(entity.region, new Messages.Movement(Packets.MovementOpcode.Stunned, {
                    id: entity.instance,
                    state: stun
                }));

            });

        }
    }

    addPlayer(player) {
        let self = this;

        self.addEntity(player);
        self.players[player.instance] = player;

        if (self.populationCallback)
            self.populationCallback();
    }

    addNPC(npc, region) {
        let self = this;

        self.addEntity(npc, region);
        self.npcs[npc.instance] = npc;
    }

    addMob(mob, region) {
        let self = this;

        if (!Mobs.exists(mob.id)) {
            log.error('Cannot spawn mob. ' + mob.id + ' does not exist.');
            return;
        }

        self.addEntity(mob, region);
        self.mobs[mob.instance] = mob;

        mob.addToChestArea(self.getChestAreas());

        mob.onHit(function(attacker) {
            if (mob.isDead() || mob.combat.started)
                return;

            mob.combat.begin(attacker);
        });
    }

    addItem(item, region) {
        let self = this;

        if (item.static)
            item.onRespawn(self.addItem.bind(self, item));

        self.addEntity(item, region);
        self.items[item.instance] = item;
    }

    addProjectile(projectile, region) {
        let self = this;

        self.addEntity(projectile, region);
        self.projectiles[projectile.instance] = projectile;
    }

    addChest(chest, region) {
        let self = this;

        self.addEntity(chest, region);
        self.chests[chest.instance] = chest;
    }

    removeEntity(entity) {
        let self = this;

        if (entity.instance in self.entities)
            delete self.entities[entity.instance];

        if (entity.instance in self.mobs)
            delete self.mobs[entity.instance];

        if (entity.instance in self.items)
            delete self.items[entity.instance];

        self.getGrids().removeFromEntityGrid(entity, entity.x, entity.y);

        self.region.remove(entity);
    }

    cleanCombat(entity) {
        let self = this;

        _.each(this.entities, function(oEntity) {
            if (oEntity instanceof Character && oEntity.combat.hasAttacker(entity))
                oEntity.combat.removeAttacker(entity);

        });
    }

    removeItem(item) {
        let self = this;

        self.removeEntity(item);
        self.network.pushBroadcast(new Messages.Despawn(item.instance));

        if (item.static)
            item.respawn();
    }

    removePlayer(player) {
        let self = this;

        self.network.pushToAdjacentRegions(player.region, new Messages.Despawn(player.instance));

        if (player.ready)
            player.save();

        if (self.populationCallback)
            self.populationCallback();

        self.removeEntity(player);

        self.cleanCombat(player);

        if (player.isGuest)
            self.database.delete(player);

        delete self.players[player.instance];
        delete self.network.packets[player.instance];
    }

    removeProjectile(projectile) {
        let self = this;

        self.removeEntity(projectile);

        delete self.projectiles[projectile.instance];
    }

    removeChest(chest) {
        let self = this;

        self.removeEntity(chest);
        self.network.pushBroadcast(new Messages.Despawn(chest.instance));

        if (chest.static)
            chest.respawn();
        else
            delete self.chests[chest.instance];
    }

    playerInWorld(username) {
        let self = this;

        for (let id in self.players)
            if (self.players.hasOwnProperty(id))
                if (self.players[id].username.toLowerCase() === username.toLowerCase())
                    return true;

        return false;
    }

    getPlayerByName(name) {
        let self = this;

        for (let id in self.players)
            if (self.players.hasOwnProperty(id))
                if (self.players[id].username.toLowerCase() === name.toLowerCase())
                    return self.players[id];

        return null;
    }

    getPlayerByInstance(instance) {
        let self = this;

        if (instance in self.players)
            return self.players[instance];

        return null;
    }

    forEachPlayer(callback) {
        _.each(this.players, function(player) {
            callback(player);
        });
    }

    getPVPAreas() {
        return this.map.areas['PVP'].pvpAreas;
    }

    getMusicAreas() {
        return this.map.areas['Music'].musicAreas;
    }

    getChestAreas() {
        return this.map.areas['Chests'].chestAreas;
    }

    getOverlayAreas() {
        return this.map.areas['Overlays'].overlayAreas;
    }

    getCameraAreas() {
        return this.map.areas['Cameras'].cameraAreas;
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

module.exports = World;
