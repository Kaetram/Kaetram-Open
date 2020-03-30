"use strict";
exports.__esModule = true;
var _ = require("underscore");
var sanitizer_1 = require("sanitizer");
var packets_1 = require("../network/packets");
var config_1 = require("../../config");
var messages_1 = require("../network/messages");
var commands_1 = require("./commands");
var items_1 = require("../util/items");
var creator_1 = require("../database/mongodb/creator");
var utils_1 = require("../util/utils");
/**
 *
 */
var Incoming = /** @class */ (function () {
    function Incoming(player) {
        var _this = this;
        this.player = player;
        this.connection = this.player.connection;
        this.world = this.player.world;
        this.globalObjects = this.world.globalObjects;
        this.database = this.player.database;
        this.commands = new commands_1["default"](this.player);
        this.connection.listen(function (data) {
            var packet = data.shift();
            var message = data[0];
            if (!utils_1["default"].validPacket(packet)) {
                console.error("Non-existent packet received: " + packet + " data: ");
                console.error(message);
                return;
            }
            _this.player.refreshTimeout();
            switch (packet) {
                case packets_1["default"].Intro:
                    _this.handleIntro(message);
                    break;
                case packets_1["default"].Ready:
                    _this.handleReady(message);
                    break;
                case packets_1["default"].Who:
                    _this.handleWho(message);
                    break;
                case packets_1["default"].Equipment:
                    _this.handleEquipment(message);
                    break;
                case packets_1["default"].Movement:
                    _this.handleMovement(message);
                    break;
                case packets_1["default"].Request:
                    _this.handleRequest(message);
                    break;
                case packets_1["default"].Target:
                    _this.handleTarget(message);
                    break;
                case packets_1["default"].Combat:
                    _this.handleCombat(message);
                    break;
                case packets_1["default"].Projectile:
                    _this.handleProjectile(message);
                    break;
                case packets_1["default"].Network:
                    _this.handleNetwork(message);
                    break;
                case packets_1["default"].Chat:
                    _this.handleChat(message);
                    break;
                case packets_1["default"].Inventory:
                    _this.handleInventory(message);
                    break;
                case packets_1["default"].Bank:
                    _this.handleBank(message);
                    break;
                case packets_1["default"].Respawn:
                    _this.handleRespawn(message);
                    break;
                case packets_1["default"].Trade:
                    _this.handleTrade(message);
                    break;
                case packets_1["default"].Enchant:
                    _this.handleEnchant(message);
                    break;
                case packets_1["default"].Click:
                    _this.handleClick(message);
                    break;
                case packets_1["default"].Warp:
                    _this.handleWarp(message);
                    break;
                case packets_1["default"].Shop:
                    _this.handleShop(message);
                    break;
                case packets_1["default"].Region:
                    _this.handleRegion(message);
                    break;
                case packets_1["default"].Camera:
                    _this.handleCamera(message);
                    break;
            }
        });
    }
    Incoming.prototype.handleRegion = function (message) {
        throw new Error('Method not implemented.');
    };
    Incoming.prototype.handleIntro = function (message) {
        var _this = this;
        var loginType = message.shift();
        var username = message.shift().toLowerCase();
        var password = message.shift();
        var isRegistering = loginType === packets_1["default"].IntroOpcode.Register;
        var isGuest = loginType === packets_1["default"].IntroOpcode.Guest;
        var email = isRegistering ? message.shift() : '';
        var formattedUsername = username
            ? username.charAt(0).toUpperCase() + username.slice(1)
            : '';
        this.player.username = formattedUsername
            .substr(0, 32)
            .trim()
            .toLowerCase();
        this.player.password = password.substr(0, 32);
        this.player.email = email.substr(0, 128).toLowerCase();
        if (this.introduced)
            return;
        if (this.world.playerInWorld(this.player.username)) {
            this.connection.sendUTF8('loggedin');
            this.connection.close('Player already logged in..');
            return;
        }
        if (config_1["default"].overrideAuth) {
            this.database.login(this.player);
            return;
        }
        if (config_1["default"].offlineMode) {
            var creator = new creator_1["default"](null);
            this.player.load(creator_1["default"].getFullData(this.player));
            this.player.intro();
            return;
        }
        this.introduced = true;
        if (isRegistering) {
            this.database.exists(this.player, function (result) {
                if (result.exists) {
                    _this.connection.sendUTF8(result.type + "exists");
                    _this.connection.close(result.type + " is not available.");
                }
                else
                    _this.database.register(_this.player);
            });
        }
        else if (isGuest) {
            this.player.username = "Guest" + utils_1["default"].randomInt(0, 2000000);
            this.player.password = null;
            this.player.email = null;
            this.player.isGuest = true;
            this.database.login(this.player);
        }
        else
            this.database.verify(this.player, function (result) {
                if (result.status === 'success')
                    _this.database.login(_this.player);
                else {
                    _this.connection.sendUTF8('invalidlogin');
                    _this.connection.close("Wrong password entered for: " + _this.player.username);
                }
            });
    };
    Incoming.prototype.handleReady = function (message) {
        var isReady = message.shift();
        var preloadedData = message.shift();
        var userAgent = message.shift();
        if (!isReady)
            return;
        if (this.player.regionsLoaded.length > 0 && !preloadedData)
            this.player.regionsLoaded = [];
        this.player.ready = true;
        this.world.region.handle(this.player);
        this.world.region.push(this.player);
        this.player.sendEquipment();
        this.player.loadInventory();
        this.player.loadQuests();
        if (this.world.map.isOutOfBounds(this.player.x, this.player.y))
            this.player.setPosition(50, 89);
        if (this.player.userAgent !== userAgent) {
            this.player.userAgent = userAgent;
            this.player.regionsLoaded = [];
            this.player.updateRegion(true);
        }
        this.player.save();
        if (this.player.readyCallback)
            this.player.readyCallback();
        this.player.sync();
    };
    Incoming.prototype.handleWho = function (message) {
        var _this = this;
        _.each(message.shift(), function (id) {
            var entity = _this.world.getEntityByInstance(id);
            if (!entity || entity.dead)
                return;
            /* We handle player-specific entity statuses here. */
            // Entity is an area-based mob
            if (entity.area)
                entity.specialState = 'area';
            if (_this.player.quests.isQuestNPC(entity))
                entity.specialState = 'questNpc';
            if (_this.player.quests.isQuestMob(entity))
                entity.specialState = 'questMob';
            if (entity.miniboss) {
                entity.specialState = 'miniboss';
                entity.customScale = 1.25;
            }
            if (entity.boss)
                entity.specialState = 'boss';
            // if (this.player.quests.isAchievementNPC(entity))
            //    entity.specialState = 'achievementNpc';
            _this.player.send(new messages_1["default"].Spawn(entity));
        });
    };
    Incoming.prototype.handleEquipment = function (message) {
        var opcode = message.shift();
        switch (opcode) {
            case packets_1["default"].EquipmentOpcode.Unequip:
                var type = message.shift();
                if (!this.player.inventory.hasSpace()) {
                    this.player.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, 'You do not have enough space in your inventory.'));
                    return;
                }
                switch (type) {
                    case 'weapon':
                        if (!this.player.hasWeapon())
                            return;
                        this.player.inventory.add(this.player.weapon.getItem());
                        this.player.setWeapon(-1, -1, -1, -1);
                        break;
                    case 'armour':
                        if (this.player.hasArmour() &&
                            this.player.armour.id === 114)
                            return;
                        this.player.inventory.add(this.player.armour.getItem());
                        this.player.setArmour(114, 1, -1, -1);
                        break;
                    case 'pendant':
                        if (!this.player.hasPendant())
                            return;
                        this.player.inventory.add(this.player.pendant.getItem());
                        this.player.setPendant(-1, -1, -1, -1);
                        break;
                    case 'ring':
                        if (!this.player.hasRing())
                            return;
                        this.player.inventory.add(this.player.ring.getItem());
                        this.player.setRing(-1, -1, -1, -1);
                        break;
                    case 'boots':
                        if (!this.player.hasBoots())
                            return;
                        this.player.inventory.add(this.player.boots.getItem());
                        this.player.setBoots(-1, -1, -1, -1);
                        break;
                }
                this.player.send(new messages_1["default"].Equipment(packets_1["default"].EquipmentOpcode.Unequip, [
                    type
                ]));
                this.player.sync();
                break;
        }
    };
    Incoming.prototype.handleMovement = function (message) {
        var opcode = message.shift();
        var orientation;
        if (!this.player || this.player.dead)
            return;
        switch (opcode) {
            case packets_1["default"].MovementOpcode.Request:
                var requestX = message.shift();
                var requestY = message.shift();
                var playerX = message.shift();
                var playerY = message.shift();
                if (this.preventNoClip(requestX, requestY))
                    this.player.guessPosition(requestX, requestY);
                this.player.movementStart = new Date().getTime();
                break;
            case packets_1["default"].MovementOpcode.Started:
                var selectedX = message.shift();
                var selectedY = message.shift();
                var pX = message.shift();
                var pY = message.shift();
                var movementSpeed = message.shift();
                if (!movementSpeed ||
                    movementSpeed !== this.player.movementSpeed)
                    this.player.incrementCheatScore(1);
                if (pX !== this.player.x ||
                    pY !== this.player.y ||
                    this.player.stunned ||
                    !this.preventNoClip(selectedX, selectedY))
                    return;
                this.player.moving = true;
                break;
            case packets_1["default"].MovementOpcode.Step:
                var x = message.shift();
                var y = message.shift();
                if (this.player.stunned || !this.preventNoClip(x, y))
                    return;
                this.player.setPosition(x, y);
                break;
            case packets_1["default"].MovementOpcode.Stop:
                var posX = message.shift();
                var posY = message.shift();
                var id = message.shift();
                var hasTarget = message.shift();
                var entity = this.world.getEntityByInstance(id);
                if (!this.player.moving) {
                    if (config_1["default"].debug)
                        console.info("[Warning] Did not receive movement start packet for " + this.player.username + ".");
                    this.player.incrementCheatScore(1);
                }
                orientation = message.shift();
                if (entity && entity.type === 'item')
                    this.player.inventory.add(entity);
                if (this.world.map.isDoor(posX, posY) && !hasTarget) {
                    var door = this.player.doors.getDoor(posX, posY);
                    if (door && this.player.doors.getStatus(door) === 'closed')
                        return;
                    var destination = this.world.map.getDoorDestination(posX, posY);
                    this.player.teleport(destination.x, destination.y, true);
                }
                else {
                    this.player.setPosition(posX, posY);
                    this.player.setOrientation(orientation);
                }
                this.player.moving = false;
                this.player.lastMovement = new Date().getTime();
                var diff = this.player.lastMovement - this.player.movementStart;
                if (diff < this.player.movementSpeed)
                    this.player.incrementCheatScore(1);
                break;
            case packets_1["default"].MovementOpcode.Entity:
                var instance = message.shift();
                var entityX = message.shift();
                var entityY = message.shift();
                var oEntity = this.world.getEntityByInstance(instance);
                if (!oEntity ||
                    (oEntity.x === entityX && oEntity.y === entityY))
                    return;
                oEntity.setPosition(entityX, entityY);
                if (oEntity.hasTarget())
                    oEntity.combat.forceAttack();
                break;
            case packets_1["default"].MovementOpcode.Orientate:
                orientation = message.shift();
                this.world.push(packets_1["default"].PushOpcode.Regions, {
                    regionId: this.player.region,
                    message: new messages_1["default"].Movement(packets_1["default"].MovementOpcode.Orientate, [this.player.instance, orientation])
                });
                break;
            case packets_1["default"].MovementOpcode.Freeze:
                /**
                 * Just used to prevent player from following entities in combat.
                 * This is primarily for the 'hold-position' functionality.
                 */
                this.player.frozen = message.shift();
                break;
            case packets_1["default"].MovementOpcode.Zone:
                var direction = message.shift();
                console.info("Player zoned - " + direction);
                break;
        }
    };
    Incoming.prototype.handleRequest = function (message) {
        var id = message.shift();
        if (id !== this.player.instance)
            return;
        this.world.region.push(this.player);
    };
    Incoming.prototype.handleTarget = function (message) {
        var opcode = message.shift();
        var instance = message.shift();
        console.debug("Targeted: " + instance);
        switch (opcode) {
            case packets_1["default"].TargetOpcode.Talk:
                var entity = this.world.getEntityByInstance(instance);
                if (!entity || !this.player.isAdjacent(entity))
                    return;
                this.player.cheatScore = 0;
                if (entity.type === 'chest') {
                    entity.openChest();
                    return;
                }
                if (entity.dead)
                    return;
                if (this.player.npcTalkCallback)
                    this.player.npcTalkCallback(entity);
                break;
            case packets_1["default"].TargetOpcode.Attack:
                var target = this.world.getEntityByInstance(instance);
                if (!target ||
                    target.dead ||
                    !this.canAttack(this.player, target))
                    return;
                this.player.cheatScore = 0;
                this.world.push(packets_1["default"].PushOpcode.Regions, {
                    regionId: target.region,
                    message: new messages_1["default"].Combat(packets_1["default"].CombatOpcode.Initiate, {
                        attackerId: this.player.instance,
                        targetId: target.instance
                    })
                });
                break;
            case packets_1["default"].TargetOpcode.None:
                this.player.combat.stop();
                this.player.removeTarget();
                break;
            case packets_1["default"].TargetOpcode.Object:
                var object = this.globalObjects.getObject(instance);
                if (!object)
                    return;
                var message_1 = this.globalObjects.talk(object, this.player);
                this.world.push(packets_1["default"].PushOpcode.Player, {
                    player: this.player,
                    message: new messages_1["default"].Bubble({
                        id: instance,
                        text: message_1,
                        duration: 5000,
                        isObject: true,
                        info: {
                            id: instance,
                            x: object.x * 16,
                            y: object.y * 16 + 8
                        }
                    })
                });
                break;
        }
    };
    Incoming.prototype.handleCombat = function (message) {
        var opcode = message.shift();
        switch (opcode) {
            case packets_1["default"].CombatOpcode.Initiate:
                var attacker = this.world.getEntityByInstance(message.shift());
                var target = this.world.getEntityByInstance(message.shift());
                if (!target ||
                    target.dead ||
                    !attacker ||
                    attacker.dead ||
                    !this.canAttack(attacker, target))
                    return;
                attacker.setTarget(target);
                if (!attacker.combat.started)
                    attacker.combat.forceAttack();
                else {
                    attacker.combat.start();
                    attacker.combat.attack(target);
                }
                if (target.combat)
                    target.combat.addAttacker(attacker);
                break;
        }
    };
    Incoming.prototype.handleProjectile = function (message) {
        var type = message.shift();
        switch (type) {
            case packets_1["default"].ProjectileOpcode.Impact:
                var projectile = this.world.getEntityByInstance(message.shift());
                var target = this.world.getEntityByInstance(message.shift());
                if (!target || target.dead || !projectile)
                    return;
                this.world.handleDamage(projectile.owner, target, projectile.damage);
                this.world.removeProjectile(projectile);
                if (target.combat.started ||
                    target.dead ||
                    target.type !== 'mob')
                    return;
                target.begin(projectile.owner);
                break;
        }
    };
    Incoming.prototype.handleNetwork = function (message) {
        var opcode = message.shift();
        switch (opcode) {
            case packets_1["default"].NetworkOpcode.Pong:
                console.info('Pingy pongy pung pong.');
                break;
        }
    };
    Incoming.prototype.handleChat = function (message) {
        var text = sanitizer_1["default"].escape(sanitizer_1["default"].sanitize(message.shift()));
        if (!text || text.length < 1 || !/\S/.test(text))
            return;
        if (text.charAt(0) === '/' || text.charAt(0) === ';')
            this.commands.parse(text);
        else {
            if (this.player.isMuted()) {
                this.player.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, 'You are currently muted.'));
                return;
            }
            if (!this.player.canTalk) {
                this.player.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, 'You are not allowed to talk for the duration of this event.'));
                return;
            }
            if (config_1["default"].debug)
                console.info(this.player.username + " - " + text);
            this.world.push(packets_1["default"].PushOpcode.Regions, {
                regionId: this.player.region,
                message: new messages_1["default"].Chat({
                    id: this.player.instance,
                    name: this.player.username,
                    withBubble: true,
                    text: text,
                    duration: 7000
                })
            });
        }
    };
    Incoming.prototype.handleInventory = function (message) {
        var opcode = message.shift();
        var id;
        var ability;
        var abilityLevel;
        switch (opcode) {
            case packets_1["default"].InventoryOpcode.Remove:
                var item = message.shift();
                var count = void 0;
                if (!item)
                    return;
                if (item.count > 1)
                    count = message.shift();
                id = items_1["default"].stringToId(item.string);
                var iSlot = this.player.inventory.slots[item.index];
                if (iSlot.id < 1)
                    return;
                if (count > iSlot.count)
                    count = iSlot.count;
                ability = iSlot.ability;
                abilityLevel = iSlot.abilityLevel;
                if (this.player.inventory.remove(id, count || item.count, item.index))
                    this.world.dropItem(id, count || 1, this.player.x, this.player.y, ability, abilityLevel);
                break;
            case packets_1["default"].InventoryOpcode.Select:
                var index = message.shift();
                var slot = this.player.inventory.slots[index];
                var string = slot.string;
                var sCount = slot.count;
                ability = slot.ability;
                abilityLevel = slot.abilityLevel;
                if (!slot || slot.id < 1)
                    return;
                id = items_1["default"].stringToId(slot.string);
                if (slot.equippable) {
                    if (!this.player.canEquip(string))
                        return;
                    this.player.inventory.remove(id, slot.count, slot.index);
                    this.player.equip(string, sCount, ability, abilityLevel);
                }
                else if (slot.edible) {
                    this.player.inventory.remove(id, 1, slot.index);
                    this.player.eat(id);
                }
                break;
        }
    };
    Incoming.prototype.handleBank = function (message) {
        var opcode = message.shift();
        switch (opcode) {
            case packets_1["default"].BankOpcode.Select:
                var type = message.shift();
                var index = message.shift();
                var isBank = type === 'bank';
                if (isBank) {
                    var bankSlot = this.player.bank.slots[index];
                    if (bankSlot.id < 1)
                        return;
                    // Infinite stacks move all at onces, otherwise move one by one.
                    var moveAmount = items_1["default"].maxStackSize(bankSlot.id) === -1
                        ? bankSlot.count
                        : 1;
                    if (this.player.inventory.add(bankSlot, moveAmount))
                        this.player.bank.remove(bankSlot.id, moveAmount, index);
                }
                else {
                    var inventorySlot = this.player.inventory.slots[index];
                    if (inventorySlot.id < 1)
                        return;
                    if (this.player.bank.add(inventorySlot.id, inventorySlot.count, inventorySlot.ability, inventorySlot.abilityLevel))
                        this.player.inventory.remove(inventorySlot.id, inventorySlot.count, index);
                }
                break;
        }
    };
    Incoming.prototype.handleRespawn = function (message) {
        var instance = message.shift();
        if (this.player.instance !== instance)
            return;
        var spawn = this.player.getSpawn();
        this.player.dead = false;
        this.player.setPosition(spawn.x, spawn.y);
        this.world.push(packets_1["default"].PushOpcode.Regions, {
            regionId: this.player.region,
            message: new messages_1["default"].Spawn(this.player),
            ignoreId: this.player.instance
        });
        this.player.send(new messages_1["default"].Respawn(this.player.instance, this.player.x, this.player.y));
        this.player.revertPoints();
    };
    Incoming.prototype.handleTrade = function (message) {
        var opcode = message.shift();
        var oPlayer = this.world.getEntityByInstance(message.shift());
        if (!oPlayer || !opcode)
            return;
        switch (opcode) {
            case packets_1["default"].TradeOpcode.Request:
                break;
            case packets_1["default"].TradeOpcode.Accept:
                break;
            case packets_1["default"].TradeOpcode.Decline:
                break;
        }
    };
    Incoming.prototype.handleEnchant = function (message) {
        var opcode = message.shift();
        switch (opcode) {
            case packets_1["default"].EnchantOpcode.Select:
                var index = message.shift();
                var item = this.player.inventory.slots[index];
                var type = 'item';
                if (item.id < 1)
                    return;
                if (items_1["default"].isShard(item.id))
                    type = 'shards';
                this.player.enchant.add(type, item);
                break;
            case packets_1["default"].EnchantOpcode.Remove:
                this.player.enchant.remove(message.shift());
                break;
            case packets_1["default"].EnchantOpcode.Enchant:
                this.player.enchant.enchant();
                break;
        }
    };
    Incoming.prototype.handleClick = function (message) {
        var type = message.shift();
        var state = message.shift();
        switch (type) {
            case 'profile':
                this.player.toggleProfile(state);
                break;
            case 'inventory':
                this.player.toggleInventory(state);
                break;
            case 'warp':
                this.player.toggleWarp(state);
                break;
        }
    };
    Incoming.prototype.handleWarp = function (message) {
        var id = parseInt(message.shift()) - 1;
        if (this.player.warp)
            this.player.warp.warp(id);
    };
    Incoming.prototype.handleShop = function (message) {
        var opcode = message.shift();
        var npcId = message.shift();
        switch (opcode) {
            case packets_1["default"].ShopOpcode.Buy:
                var buyId = message.shift();
                var amount = message.shift();
                if (!buyId || !amount) {
                    this.player.notify('Incorrect purchase packets.');
                    return;
                }
                console.debug("Received Buy: " + npcId + " " + buyId + " " + amount);
                this.world.shops.buy(this.player, npcId, buyId, amount);
                break;
            case packets_1["default"].ShopOpcode.Sell:
                if (!this.player.selectedShopItem) {
                    this.player.notify('No item has been selected.');
                    return;
                }
                this.world.shops.sell(this.player, npcId, this.player.selectedShopItem.index);
                break;
            case packets_1["default"].ShopOpcode.Select:
                var slotId = message.shift();
                if (!slotId) {
                    this.player.notify('Incorrect purchase packets.');
                    return;
                }
                slotId = parseInt(slotId);
                /**
                 * Though all this could be done client-sided
                 * it's just safer to send it to the server to sanitize data.
                 * It also allows us to add cheat checks in the future
                 * or do some fancier stuff.
                 */
                var item = this.player.inventory.slots[slotId];
                if (!item || item.id < 1)
                    return;
                if (this.player.selectedShopItem)
                    this.world.shops.remove(this.player);
                var currency = this.world.shops.getCurrency(npcId);
                if (!currency)
                    return;
                this.player.send(new messages_1["default"].Shop(packets_1["default"].ShopOpcode.Select, {
                    id: npcId,
                    slotId: slotId,
                    currency: items_1["default"].idToString(currency),
                    price: this.world.shops.getSellPrice(npcId, item.id)
                }));
                this.player.selectedShopItem = {
                    id: npcId,
                    index: item.index
                };
                console.debug("Received Select: " + npcId + " " + slotId);
                break;
            case packets_1["default"].ShopOpcode.Remove:
                this.world.shops.remove(this.player);
                break;
        }
    };
    Incoming.prototype.handleCamera = function (message) {
        console.info(this.player.x + " " + this.player.y);
        this.player.cameraArea = null;
        this.player.handler.detectCamera(this.player.x, this.player.y);
    };
    Incoming.prototype.canAttack = function (attacker, target) {
        /**
         * Used to prevent client-sided manipulation. The client will send the packet to start combat
         * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
         */
        if (attacker.type === 'mob' || target.type === 'mob')
            return true;
        return (attacker.type === 'player' &&
            target.type === 'player' &&
            attacker.pvp &&
            target.pvp);
    };
    Incoming.prototype.preventNoClip = function (x, y) {
        var isMapColliding = this.world.map.isColliding(x, y);
        var isInstanceColliding = this.player.doors.hasCollision(x, y);
        if (isMapColliding || isInstanceColliding) {
            this.player.stopMovement(true);
            this.player.notify('We have detected no-clipping in your client. Please submit a bug report.');
            x =
                this.player.previousX < 0
                    ? this.player.x
                    : this.player.previousX;
            y =
                this.player.previousY < 0
                    ? this.player.y
                    : this.player.previousY;
            if (this.world.map.isColliding(x, y)) {
                var spawn = this.player.getSpawn();
                x = spawn.x;
                y = spawn.y;
            }
            this.player.teleport(x, y, false, true);
            return false;
        }
        return true;
    };
    return Incoming;
}());
exports["default"] = Incoming;
