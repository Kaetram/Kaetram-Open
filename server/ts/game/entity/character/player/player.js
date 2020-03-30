"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var config_1 = require("../../../../../config");
var incoming_1 = require("../../../../controllers/incoming");
var quests_1 = require("../../../../controllers/quests");
var messages_1 = require("../../../../network/messages");
var packets_1 = require("../../../../network/packets");
var constants_1 = require("../../../../util/constants");
var formulas_1 = require("../../../../util/formulas");
var items_1 = require("../../../../util/items");
var modules_1 = require("../../../../util/modules");
var utils_1 = require("../../../../util/utils");
var character_1 = require("../character");
var hit_1 = require("../combat/hit");
var abilities_1 = require("./ability/abilities");
var bank_1 = require("./containers/bank/bank");
var inventory_1 = require("./containers/inventory/inventory");
var doors_1 = require("./doors");
var enchant_1 = require("./enchant");
var armour_1 = require("./equipment/armour");
var boots_1 = require("./equipment/boots");
var pendant_1 = require("./equipment/pendant");
var ring_1 = require("./equipment/ring");
var weapon_1 = require("./equipment/weapon");
var handler_1 = require("./handler");
var hitpoints_1 = require("./points/hitpoints");
var mana_1 = require("./points/mana");
var trade_1 = require("./trade");
var warp_1 = require("./warp");
/**
 *
 */
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    /**
     * Creates an instance of Player.
     * @param world -
     * @param database -
     * @param connection -
     * @param clientId -
     */
    function Player(world, database, connection, clientId) {
        var _this = _super.call(this, -1, 'player', connection.id, -1, -1) || this;
        _this.world = world;
        _this.database = database;
        _this.connection = connection;
        _this.clientId = clientId;
        _this.world = world;
        _this.database = database;
        _this.connection = connection;
        _this.clientId = clientId;
        _this.incoming = new incoming_1["default"](_this);
        _this.ready = false;
        _this.moving = false;
        _this.potentialPosition = null;
        _this.futurePosition = null;
        _this.regionPosition = null;
        _this.newRegion = false;
        _this.team = null;
        _this.userAgent = null;
        _this.guild = null;
        _this.disconnectTimeout = null;
        _this.timeoutDuration = 1000 * 60 * 10; // 10 minutes
        _this.lastRegionChange = new Date().getTime();
        _this.handler = new handler_1["default"](_this);
        _this.inventory = new inventory_1["default"](_this, 20);
        _this.abilities = new abilities_1["default"](_this);
        _this.enchant = new enchant_1["default"](_this);
        _this.bank = new bank_1["default"](_this, 56);
        _this.quests = new quests_1["default"](_this);
        _this.trade = new trade_1["default"](_this);
        _this.doors = new doors_1["default"](_this);
        _this.warp = new warp_1["default"](_this);
        _this.introduced = false;
        _this.currentSong = null;
        _this.acceptedTrade = false;
        _this.invincible = false;
        _this.noDamage = false;
        _this.isGuest = false;
        _this.pvp = false;
        _this.canTalk = true;
        _this.instanced = false;
        _this.visible = true;
        _this.talkIndex = 0;
        _this.cheatScore = 0;
        _this.defaultMovementSpeed = 250; // For fallback.
        _this.regionsLoaded = [];
        _this.lightsLoaded = [];
        _this.npcTalk = null;
        return _this;
    }
    Player.prototype.load = function (data) {
        this.kind = data.kind;
        this.rights = data.rights;
        this.experience = data.experience;
        this.ban = data.ban;
        this.mute = data.mute;
        this.membership = data.membership;
        this.lastLogin = data.lastLogin;
        this.pvpKills = data.pvpKills;
        this.pvpDeaths = data.pvpDeaths;
        this.orientation = data.orientation;
        this.mapVersion = data.mapVersion;
        this.warp.setLastWarp(data.lastWarp);
        this.level = formulas_1["default"].expToLevel(this.experience);
        this.nextExperience = formulas_1["default"].nextExp(this.experience);
        this.prevExperience = formulas_1["default"].prevExp(this.experience);
        this.hitPoints = new hitpoints_1["default"](data.hitPoints, formulas_1["default"].getMaxHitPoints(this.level));
        this.mana = new mana_1["default"](data.mana, formulas_1["default"].getMaxMana(this.level));
        if (data.invisibleIds)
            this.invisiblesIds = data.invisibleIds.split(' ');
        this.userAgent = data.userAgent;
        var armour = data.armour;
        var weapon = data.weapon;
        var pendant = data.pendant;
        var ring = data.ring;
        var boots = data.boots;
        this.setPosition(data.x, data.y);
        this.setArmour(armour[0], armour[1], armour[2], armour[3]);
        this.setWeapon(weapon[0], weapon[1], weapon[2], weapon[3]);
        this.setPendant(pendant[0], pendant[1], pendant[2], pendant[3]);
        this.setRing(ring[0], ring[1], ring[2], ring[3]);
        this.setBoots(boots[0], boots[1], boots[2], boots[3]);
    };
    Player.prototype.loadRegions = function (regions) {
        if (!regions)
            return;
        if (this.mapVersion !== this.world.map.version) {
            this.mapVersion = this.world.map.version;
            this.save();
            if (config_1["default"].debug)
                console.info("Updated map version for " + this.username);
            return;
        }
        if (regions.gameVersion === config_1["default"].gver)
            this.regionsLoaded = regions.regions.split(',');
    };
    Player.prototype.loadInventory = function () {
        var _this = this;
        if (config_1["default"].offlineMode) {
            this.inventory.loadEmpty();
            return;
        }
        this.database.loader.getInventory(this, function (ids, counts, skills, skillLevels) {
            if (ids === null && counts === null) {
                _this.inventory.loadEmpty();
                return;
            }
            if (ids.length !== _this.inventory.size)
                _this.save();
            _this.inventory.load(ids, counts, skills, skillLevels);
            _this.inventory.check();
            _this.loadBank();
        });
    };
    Player.prototype.loadBank = function () {
        var _this = this;
        if (config_1["default"].offlineMode) {
            this.bank.loadEmpty();
            return;
        }
        this.database.loader.getBank(this, function (ids, counts, skills, skillLevels) {
            if (ids.length !== _this.bank.size)
                _this.save();
            _this.bank.load(ids, counts, skills, skillLevels);
            _this.bank.check();
        });
    };
    Player.prototype.loadQuests = function () {
        var _this = this;
        if (config_1["default"].offlineMode)
            return;
        this.database.loader.getAchievements(this, function (ids, progress) {
            ids.pop();
            progress.pop();
            if (_this.quests.getAchievementSize() !== ids.length) {
                console.info('Mismatch in achievements data.');
                _this.save();
            }
            _this.quests.updateAchievements(ids, progress);
        });
        this.database.loader.getQuests(this, function (ids, stages) {
            if (!ids || !stages) {
                _this.quests.updateQuests(ids, stages);
                return;
            }
            /* Removes the empty space created by the loader */
            ids.pop();
            stages.pop();
            if (_this.quests.getQuestSize() !== ids.length) {
                console.info('Mismatch in quest data.');
                _this.save();
            }
            _this.quests.updateQuests(ids, stages);
        });
        this.quests.onAchievementsReady(function () {
            _this.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.AchievementBatch, _this.quests.getAchievementData()));
            /* Update region here because we receive quest info */
            _this.updateRegion();
            _this.achievementsLoaded = true;
        });
        this.quests.onQuestsReady(function () {
            _this.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.QuestBatch, _this.quests.getQuestData()));
            /* Update region here because we receive quest info */
            _this.updateRegion();
            _this.questsLoaded = true;
        });
    };
    Player.prototype.intro = function () {
        if (this.ban > new Date()) {
            this.connection.sendUTF8('ban');
            this.connection.close("Player: " + this.username + " is banned.");
        }
        if (this.x <= 0 || this.y <= 0)
            this.sendToSpawn();
        if (this.hitPoints.getHitPoints() < 0)
            this.hitPoints.setHitPoints(this.getMaxHitPoints());
        if (this.mana.getMana() < 0)
            this.mana.setMana(this.mana.getMaxMana());
        this.verifyRights();
        var info = {
            instance: this.instance,
            username: utils_1["default"].formatUsername(this.username),
            x: this.x,
            y: this.y,
            kind: this.kind,
            rights: this.rights,
            hitPoints: this.hitPoints.getData(),
            mana: this.mana.getData(),
            experience: this.experience,
            nextExperience: this.nextExperience,
            prevExperience: this.prevExperience,
            level: this.level,
            lastLogin: this.lastLogin,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            orientation: this.orientation,
            movementSpeed: this.getMovementSpeed()
        };
        this.regionPosition = [this.x, this.y];
        /**
         * Send player data to client here
         */
        this.world.addPlayer(this);
        this.send(new messages_1["default"].Welcome(info));
    };
    Player.prototype.verifyRights = function () {
        if (config_1["default"].moderators.indexOf(this.username.toLowerCase()) > -1)
            this.rights = 1;
        if (config_1["default"].administrators.indexOf(this.username.toLowerCase()) > -1 ||
            config_1["default"].offlineMode)
            this.rights = 2;
    };
    Player.prototype.addExperience = function (exp) {
        this.experience += exp;
        var oldLevel = this.level;
        this.level = formulas_1["default"].expToLevel(this.experience);
        this.nextExperience = formulas_1["default"].nextExp(this.experience);
        this.prevExperience = formulas_1["default"].prevExp(this.experience);
        if (oldLevel !== this.level) {
            this.hitPoints.setMaxHitPoints(formulas_1["default"].getMaxHitPoints(this.level));
            this.updateRegion();
        }
        var data = {
            id: this.instance,
            level: this.level
        };
        /**
         * Sending two sets of data as other users do not need to
         * know the experience of another player.. (yet).
         */
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Experience(data), this.instance);
        data.amount = exp;
        data.experience = this.experience;
        data.nextExperience = this.nextExperience;
        data.prevExperience = this.prevExperience;
        this.send(new messages_1["default"].Experience(data));
        this.sync();
    };
    Player.prototype.heal = function (amount) {
        /**
         * Passed from the superclass...
         */
        if (!this.hitPoints || !this.mana)
            return;
        this.hitPoints.heal(amount);
        this.mana.heal(amount);
        this.sync();
    };
    Player.prototype.healHitPoints = function (amount) {
        var type = 'health';
        this.hitPoints.heal(amount);
        this.sync();
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Heal({
            id: this.instance,
            type: type,
            amount: amount
        }));
    };
    Player.prototype.healManaPoints = function (amount) {
        var type = 'mana';
        this.mana.heal(amount);
        this.sync();
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Heal({
            id: this.instance,
            type: type,
            amount: amount
        }));
    };
    Player.prototype.eat = function (id) {
        var Item = items_1["default"].getPlugin(id);
        if (!Item)
            return;
        new Item(id).onUse(this);
    };
    Player.prototype.equip = function (string, count, ability, abilityLevel) {
        var data = items_1["default"].getData(string);
        var type;
        var id = items_1["default"].stringToId(string);
        var power = items_1["default"].getLevelRequirement(string) / 2;
        if (!data || data === 'null')
            return;
        if (config_1["default"].debug)
            console.info("Equipping item - " + [string, count, ability, abilityLevel]);
        if (items_1["default"].isArmour(string))
            type = modules_1["default"].Equipment.Armour;
        else if (items_1["default"].isWeapon(string))
            type = modules_1["default"].Equipment.Weapon;
        else if (items_1["default"].isPendant(string))
            type = modules_1["default"].Equipment.Pendant;
        else if (items_1["default"].isRing(string))
            type = modules_1["default"].Equipment.Ring;
        else if (items_1["default"].isBoots(string))
            type = modules_1["default"].Equipment.Boots;
        switch (type) {
            case modules_1["default"].Equipment.Armour:
                if (this.hasArmour() && this.armour.id !== 114)
                    this.inventory.add(this.armour.getItem());
                this.setArmour(id, count, ability, abilityLevel, power);
                break;
            case modules_1["default"].Equipment.Weapon:
                if (this.hasWeapon())
                    this.inventory.add(this.weapon.getItem());
                this.setWeapon(id, count, ability, abilityLevel, power);
                break;
            case modules_1["default"].Equipment.Pendant:
                if (this.hasPendant())
                    this.inventory.add(this.pendant.getItem());
                this.setPendant(id, count, ability, abilityLevel, power);
                break;
            case modules_1["default"].Equipment.Ring:
                if (this.hasRing())
                    this.inventory.add(this.ring.getItem());
                this.setRing(id, count, ability, abilityLevel, power);
                break;
            case modules_1["default"].Equipment.Boots:
                if (this.hasBoots())
                    this.inventory.add(this.boots.getItem());
                this.setBoots(id, count, ability, abilityLevel, power);
                break;
        }
        this.send(new messages_1["default"].Equipment(packets_1["default"].EquipmentOpcode.Equip, {
            type: type,
            name: items_1["default"].idToName(id),
            string: string,
            count: count,
            ability: ability,
            abilityLevel: abilityLevel,
            power: power
        }));
        this.sync();
    };
    Player.prototype.updateRegion = function (force) {
        this.world.region.sendRegion(this, this.region, force);
    };
    Player.prototype.isInvisible = function (instance) {
        var entity = this.world.getEntityByInstance(instance);
        if (!entity)
            return false;
        return _super.prototype.hasInvisibleId.call(this, entity.id) || _super.prototype.hasInvisible.call(this, entity);
    };
    Player.prototype.formatInvisibles = function () {
        return this.invisiblesIds.join(' ');
    };
    Player.prototype.canEquip = function (string) {
        var requirement = items_1["default"].getLevelRequirement(string);
        if (requirement > constants_1["default"].MAX_LEVEL)
            requirement = constants_1["default"].MAX_LEVEL;
        if (requirement > this.level) {
            this.notify("You must be at least level " + requirement + " to equip this.");
            return false;
        }
        return true;
    };
    Player.prototype.die = function () {
        this.dead = true;
        if (this.deathCallback)
            this.deathCallback();
        this.send(new messages_1["default"].Death(this.instance));
    };
    Player.prototype.teleport = function (x, y, isDoor, animate) {
        if (this.teleportCallback)
            this.teleportCallback(x, y, isDoor);
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Teleport({
            id: this.instance,
            x: x,
            y: y,
            withAnimation: animate
        }));
        this.setPosition(x, y);
        this.world.cleanCombat(this);
    };
    Player.prototype.incrementCheatScore = function (amount) {
        if (this.combat.started)
            return;
        this.cheatScore += amount;
        if (this.cheatScoreCallback)
            this.cheatScoreCallback();
    };
    Player.prototype.updatePVP = function (pvp, permanent) {
        /**
         * No need to update if the state is the same
         */
        if (!this.region)
            return;
        if (this.pvp === pvp || this.permanentPVP)
            return;
        if (this.pvp && !pvp)
            this.notify('You are no longer in a PvP zone!');
        else
            this.notify('You have entered a PvP zone!');
        this.pvp = pvp;
        this.permanentPVP = permanent;
        this.sendToAdjacentRegions(this.region, new messages_1["default"].PVP(this.instance, this.pvp));
    };
    Player.prototype.updateOverlay = function (overlay) {
        if (this.overlayArea === overlay)
            return;
        this.overlayArea = overlay;
        if (overlay && overlay.id) {
            this.lightsLoaded = [];
            this.send(new messages_1["default"].Overlay(packets_1["default"].OverlayOpcode.Set, {
                image: overlay.fog ? overlay.fog : 'empty',
                colour: "rgba(0,0,0," + overlay.darkness + ")"
            }));
        }
        else
            this.send(new messages_1["default"].Overlay(packets_1["default"].OverlayOpcode.Remove));
    };
    Player.prototype.updateCamera = function (camera) {
        if (this.cameraArea === camera)
            return;
        this.cameraArea = camera;
        if (camera) {
            switch (camera.type) {
                case 'lockX':
                    this.send(new messages_1["default"].Camera(packets_1["default"].CameraOpcode.LockX));
                    break;
                case 'lockY':
                    this.send(new messages_1["default"].Camera(packets_1["default"].CameraOpcode.LockY));
                    break;
                case 'player':
                    this.send(new messages_1["default"].Camera(packets_1["default"].CameraOpcode.Player));
                    break;
            }
        }
        else
            this.send(new messages_1["default"].Camera(packets_1["default"].CameraOpcode.FreeFlow));
    };
    Player.prototype.updateMusic = function (song) {
        this.currentSong = song;
        this.send(new messages_1["default"].Audio(song));
    };
    Player.prototype.revertPoints = function () {
        this.hitPoints.setHitPoints(this.hitPoints.getMaxHitPoints());
        this.mana.setMana(this.mana.getMaxMana());
        this.sync();
    };
    Player.prototype.applyDamage = function (damage) {
        this.hitPoints.decrement(damage);
    };
    Player.prototype.toggleProfile = function (state) {
        this.profileDialogOpen = state;
        if (this.profileToggleCallback)
            this.profileToggleCallback(state);
    };
    Player.prototype.toggleInventory = function (state) {
        this.inventoryOpen = state;
        if (this.inventoryToggleCallback)
            this.inventoryToggleCallback(state);
    };
    Player.prototype.toggleWarp = function (state) {
        this.warpOpen = state;
        if (this.warpToggleCallback)
            this.warpToggleCallback(state);
    };
    Player.prototype.getMana = function () {
        return this.mana.getMana();
    };
    Player.prototype.getMaxMana = function () {
        return this.mana.getMaxMana();
    };
    Player.prototype.getHitPoints = function () {
        return this.hitPoints.getHitPoints();
    };
    Player.prototype.getMaxHitPoints = function () {
        return this.hitPoints.getMaxHitPoints();
    };
    Player.prototype.getTutorial = function () {
        return this.quests.getQuest(modules_1["default"].Quests.Introduction);
    };
    Player.prototype.getMovementSpeed = function () {
        var itemMovementSpeed = items_1["default"].getMovementSpeed(this.armour.name);
        var movementSpeed = itemMovementSpeed || this.defaultMovementSpeed;
        /*
         * Here we can handle equipment/potions/abilities that alter
         * the player's movement speed. We then just broadcast it.
         */
        this.movementSpeed = movementSpeed;
        return this.movementSpeed;
    };
    /**
     * Setters
     */
    Player.prototype.setArmour = function (id, count, ability, abilityLevel, power) {
        if (!id)
            return;
        this.armour = new armour_1["default"](items_1["default"].idToString(id), id, count, ability, abilityLevel);
    };
    Player.prototype.breakWeapon = function () {
        this.notify('Your weapon has been broken.');
        this.setWeapon(-1, 0, 0, 0);
        this.sendEquipment();
    };
    Player.prototype.setWeapon = function (id, count, ability, abilityLevel, power) {
        if (!id)
            return;
        this.weapon = new weapon_1["default"](items_1["default"].idToString(id), id, count, ability, abilityLevel);
        if (this.weapon.ranged)
            this.attackRange = 7;
    };
    Player.prototype.setPendant = function (id, count, ability, abilityLevel, power) {
        if (!id)
            return;
        this.pendant = new pendant_1["default"](items_1["default"].idToString(id), id, count, ability, abilityLevel);
    };
    Player.prototype.setRing = function (id, count, ability, abilityLevel, power) {
        if (!id)
            return;
        this.ring = new ring_1["default"](items_1["default"].idToString(id), id, count, ability, abilityLevel);
    };
    Player.prototype.setBoots = function (id, count, ability, abilityLevel, power) {
        if (!id)
            return;
        this.boots = new boots_1["default"](items_1["default"].idToString(id), id, count, ability, abilityLevel);
    };
    Player.prototype.guessPosition = function (x, y) {
        this.potentialPosition = {
            x: x,
            y: y
        };
    };
    Player.prototype.setPosition = function (x, y) {
        if (this.dead)
            return;
        if (this.world.map.isOutOfBounds(x, y)) {
            x = 50;
            y = 89;
        }
        _super.prototype.setPosition.call(this, x, y);
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Move, {
            id: this.instance,
            x: x,
            y: y,
            forced: false,
            teleport: false
        }), this.instance);
    };
    Player.prototype.setOrientation = function (orientation) {
        this.orientation = orientation;
        if (this.orientationCallback)
            // Will be necessary in the future.
            this.orientationCallback();
    };
    Player.prototype.setFuturePosition = function (x, y) {
        /**
         * Most likely will be used for anti-cheating methods
         * of calculating the actual time and duration for the
         * displacement.
         */
        this.futurePosition = {
            x: x,
            y: y
        };
    };
    Player.prototype.loadRegion = function (regionId) {
        this.regionsLoaded.push(regionId);
    };
    Player.prototype.hasLoadedRegion = function (region) {
        return this.regionsLoaded.indexOf(region) > -1;
    };
    Player.prototype.hasLoadedLight = function (light) {
        return this.lightsLoaded.indexOf(light) > -1;
    };
    Player.prototype.timeout = function () {
        this.connection.sendUTF8('timeout');
        this.connection.close('Player timed out.');
    };
    Player.prototype.refreshTimeout = function () {
        var _this = this;
        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(function () {
            _this.timeout();
        }, this.timeoutDuration);
    };
    /**
     * Getters
     */
    Player.prototype.hasArmour = function () {
        return (this.armour && this.armour.name !== 'null' && this.armour.id !== -1);
    };
    Player.prototype.hasWeapon = function () {
        return (this.weapon && this.weapon.name !== 'null' && this.weapon.id !== -1);
    };
    Player.prototype.hasBreakableWeapon = function () {
        return this.weapon && this.weapon.breakable;
    };
    Player.prototype.hasPendant = function () {
        return (this.pendant &&
            this.pendant.name !== 'null' &&
            this.pendant.id !== -1);
    };
    Player.prototype.hasRing = function () {
        return this.ring && this.ring.name !== 'null' && this.ring.id !== -1;
    };
    Player.prototype.hasBoots = function () {
        return this.boots && this.boots.name !== 'null' && this.boots.id !== -1;
    };
    Player.prototype.hasMaxHitPoints = function () {
        return this.getHitPoints() >= this.hitPoints.getMaxHitPoints();
    };
    Player.prototype.hasMaxMana = function () {
        return this.mana.getMana() >= this.mana.getMaxMana();
    };
    Player.prototype.hasSpecialAttack = function () {
        return (this.weapon &&
            (this.weapon.hasCritical() ||
                this.weapon.hasExplosive() ||
                this.weapon.hasStun()));
    };
    // eslint-disable-next-line class-methods-use-this
    Player.prototype.canBeStunned = function () {
        return true;
    };
    Player.prototype.getState = function () {
        return {
            type: this.type,
            id: this.instance,
            name: utils_1["default"].formatUsername(this.username),
            x: this.x,
            y: this.y,
            rights: this.rights,
            level: this.level,
            pvp: this.pvp,
            pvpKills: this.pvpKills,
            pvpDeaths: this.pvpDeaths,
            attackRange: this.attackRange,
            orientation: this.orientation,
            hitPoints: this.hitPoints.getData(),
            movementSpeed: this.getMovementSpeed(),
            mana: this.mana.getData(),
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };
    };
    Player.prototype.getRemoteAddress = function () {
        return this.connection.socket.conn.remoteAddress;
    };
    Player.prototype.getSpawn = function () {
        var position;
        /**
         * Here we will implement functions from quests and
         * other special events and determine a spawn point.
         */
        return this.finishedTutorial() ? { x: 325, y: 87 } : { x: 375, y: 41 };
    };
    Player.prototype.getHit = function (target) {
        var defaultDamage = formulas_1["default"].getDamage(this, target);
        var isSpecial = 100 - this.weapon.abilityLevel < utils_1["default"].randomInt(0, 100);
        if (!this.hasSpecialAttack() || !isSpecial)
            return new hit_1["default"](modules_1["default"].Hits.Damage, defaultDamage);
        switch (this.weapon.ability) {
            case modules_1["default"].Enchantment.Critical:
                /**
                 * Still experimental, not sure how likely it is that you're
                 * gonna do a critical strike. I just do not want it getting
                 * out of hand, it's easier to buff than to nerf..
                 */
                var multiplier = 1.0 + this.weapon.abilityLevel;
                var damage = defaultDamage * multiplier;
                return new hit_1["default"](modules_1["default"].Hits.Critical, damage);
            case modules_1["default"].Enchantment.Stun:
                return new hit_1["default"](modules_1["default"].Hits.Stun, defaultDamage);
            case modules_1["default"].Enchantment.Explosive:
                return new hit_1["default"](modules_1["default"].Hits.Explosive, defaultDamage);
        }
    };
    Player.prototype.isMuted = function () {
        var time = new Date().getTime();
        return this.mute - time > 0;
    };
    Player.prototype.isRanged = function () {
        return this.weapon && this.weapon.isRanged();
    };
    Player.prototype.isDead = function () {
        return this.getHitPoints() < 1 || this.dead;
    };
    /**
     * Miscellaneous
     */
    Player.prototype.send = function (message) {
        this.world.push(packets_1["default"].PushOpcode.Player, {
            player: this,
            message: message
        });
    };
    Player.prototype.sendToRegion = function (message) {
        this.world.push(packets_1["default"].PushOpcode.Region, {
            regionId: this.region,
            message: message
        });
    };
    Player.prototype.sendToAdjacentRegions = function (regionId, message, ignoreId) {
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: regionId,
            message: message,
            ignoreId: ignoreId
        });
    };
    Player.prototype.sendEquipment = function () {
        var info = {
            armour: this.armour.getData(),
            weapon: this.weapon.getData(),
            pendant: this.pendant.getData(),
            ring: this.ring.getData(),
            boots: this.boots.getData()
        };
        this.send(new messages_1["default"].Equipment(packets_1["default"].EquipmentOpcode.Batch, info));
    };
    Player.prototype.sendToSpawn = function () {
        var position = this.getSpawn();
        this.x = position.x;
        this.y = position.y;
    };
    Player.prototype.sync = function () {
        /**
         * Function to be used for syncing up health,
         * mana, exp, and other variables
         */
        if (!this.hitPoints || !this.mana)
            return;
        var info = {
            id: this.instance,
            attackRange: this.attackRange,
            hitPoints: this.getHitPoints(),
            maxHitPoints: this.getMaxHitPoints(),
            mana: this.mana.getMana(),
            maxMana: this.mana.getMaxMana(),
            level: this.level,
            armour: this.armour.getString(),
            weapon: this.weapon.getData(),
            poison: !!this.poison,
            movementSpeed: this.getMovementSpeed()
        };
        this.sendToAdjacentRegions(this.region, new messages_1["default"].Sync(info));
        this.save();
    };
    Player.prototype.notify = function (message) {
        if (!message)
            return;
        this.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, message));
    };
    Player.prototype.stopMovement = function (force) {
        /**
         * Forcefully stopping the player will simply halt
         * them in between tiles. Should only be used if they are
         * being transported elsewhere.
         */
        this.send(new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Stop, {
            instance: this.instance,
            force: force
        }));
    };
    Player.prototype.finishedTutorial = function () {
        if (!this.quests || !config_1["default"].tutorialEnabled)
            return true;
        return this.quests.getQuest(0).isFinished();
    };
    Player.prototype.finishedAchievement = function (id) {
        var achievement = this.quests.achievements[id];
        if (!achievement)
            return true;
        return achievement.isFinished();
    };
    Player.prototype.finishAchievement = function (id) {
        var achievement = this.quests.achievements[id];
        if (!achievement || achievement.isFinished())
            return;
        achievement.finish();
    };
    Player.prototype.checkRegions = function () {
        if (!this.regionPosition)
            return;
        var diffX = Math.abs(this.regionPosition[0] - this.x);
        var diffY = Math.abs(this.regionPosition[1] - this.y);
        if (diffX >= 10 || diffY >= 10) {
            this.regionPosition = [this.x, this.y];
            if (this.regionCallback)
                this.regionCallback();
        }
    };
    Player.prototype.movePlayer = function () {
        /**
         * Server-sided callbacks towards movement should
         * not be able to be overwritten. In the case that
         * this is used (for Quests most likely) the server must
         * check that no hacker removed the constraint in the client-side.
         * If they are not within the bounds, apply the according punishment.
         */
        this.send(new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Started));
    };
    Player.prototype.walkRandomly = function () {
        var _this = this;
        setInterval(function () {
            _this.setPosition(_this.x + utils_1["default"].randomInt(-5, 5), _this.y + utils_1["default"].randomInt(-5, 5));
        }, 2000);
    };
    Player.prototype.killCharacter = function (character) {
        if (this.killCallback)
            this.killCallback(character);
    };
    Player.prototype.save = function () {
        if (config_1["default"].offlineMode || this.isGuest)
            return;
        if ((!this.questsLoaded || !this.achievementsLoaded) && !this["new"])
            return;
        this.database.creator.save(this);
    };
    Player.prototype.inTutorial = function () {
        return this.world.map.inTutorialArea(this);
    };
    Player.prototype.hasAggressionTimer = function () {
        return new Date().getTime() - this.lastRegionChange < 1200000; // 20 Minutes
    };
    Player.prototype.onOrientation = function (callback) {
        this.orientationCallback = callback;
    };
    Player.prototype.onRegion = function (callback) {
        this.regionCallback = callback;
    };
    Player.prototype.onAttack = function (callback) {
        this.attackCallback = callback;
    };
    Player.prototype.onHit = function (callback) {
        this.hitCallback = callback;
    };
    Player.prototype.onKill = function (callback) {
        this.killCallback = callback;
    };
    Player.prototype.onDeath = function (callback) {
        this.deathCallback = callback;
    };
    Player.prototype.onTalkToNPC = function (callback) {
        this.npcTalkCallback = callback;
    };
    Player.prototype.onDoor = function (callback) {
        this.doorCallback = callback;
    };
    Player.prototype.onTeleport = function (callback) {
        this.teleportCallback = callback;
    };
    Player.prototype.onProfile = function (callback) {
        this.profileToggleCallback = callback;
    };
    Player.prototype.onInventory = function (callback) {
        this.inventoryToggleCallback = callback;
    };
    Player.prototype.onWarp = function (callback) {
        this.warpToggleCallback = callback;
    };
    Player.prototype.onCheatScore = function (callback) {
        this.cheatScoreCallback = callback;
    };
    Player.prototype.onReady = function (callback) {
        this.readyCallback = callback;
    };
    return Player;
}(character_1["default"]));
exports["default"] = Player;
