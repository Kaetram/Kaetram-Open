import Request from 'request';
import * as _ from 'underscore';
import sanitizer from 'sanitizer';
import Packets from '../network/packets';
import config from '../../config';
import Messages from '../network/messages';
import Commands from './commands';
import Items from '../util/items';
import Creator from '../database/mongodb/creator';
import Utils from '../util/utils';
import World from '../game/world';
import Player from '../game/entity/character/player/player';

/**
 *
 */
class Incoming {
    handleRegion(message: any) {
        throw new Error('Method not implemented.');
    }

    public introduced: any;

    public world: World;

    public connection: any;

    public database: any;

    public globalObjects: any;

    public commands: any;

    constructor(public player: any) {
        this.connection = this.player.connection;
        this.world = this.player.world;
        this.globalObjects = this.world.globalObjects;
        this.database = this.player.database;
        this.commands = new Commands(this.player);

        this.connection.listen((data) => {
            const packet = data.shift();
            const message = data[0];

            if (!Utils.validPacket(packet)) {
                console.error(`Non-existent packet received: ${packet} data: `);

                console.error(message);

                return;
            }

            this.player.refreshTimeout();

            switch (packet) {
                case Packets.Intro:
                    this.handleIntro(message);
                    break;

                case Packets.Ready:
                    this.handleReady(message);
                    break;

                case Packets.Who:
                    this.handleWho(message);
                    break;

                case Packets.Equipment:
                    this.handleEquipment(message);
                    break;

                case Packets.Movement:
                    this.handleMovement(message);
                    break;

                case Packets.Request:
                    this.handleRequest(message);
                    break;

                case Packets.Target:
                    this.handleTarget(message);
                    break;

                case Packets.Combat:
                    this.handleCombat(message);
                    break;

                case Packets.Projectile:
                    this.handleProjectile(message);
                    break;

                case Packets.Network:
                    this.handleNetwork(message);
                    break;

                case Packets.Chat:
                    this.handleChat(message);
                    break;

                case Packets.Inventory:
                    this.handleInventory(message);
                    break;

                case Packets.Bank:
                    this.handleBank(message);
                    break;

                case Packets.Respawn:
                    this.handleRespawn(message);
                    break;

                case Packets.Trade:
                    this.handleTrade(message);
                    break;

                case Packets.Enchant:
                    this.handleEnchant(message);
                    break;

                case Packets.Click:
                    this.handleClick(message);
                    break;

                case Packets.Warp:
                    this.handleWarp(message);
                    break;

                case Packets.Shop:
                    this.handleShop(message);
                    break;

                case Packets.Region:
                    this.handleRegion(message);
                    break;

                case Packets.Camera:
                    this.handleCamera(message);
                    break;
            }
        });
    }

    handleIntro(message) {
        const loginType = message.shift();
        const username = message.shift().toLowerCase();
        const password = message.shift();
        const isRegistering = loginType === Packets.IntroOpcode.Register;
        const isGuest = loginType === Packets.IntroOpcode.Guest;
        const email = isRegistering ? message.shift() : '';
        const formattedUsername = username
            ? username.charAt(0).toUpperCase() + username.slice(1)
            : '';

        this.player.username = formattedUsername
            .substr(0, 32)
            .trim()
            .toLowerCase();
        this.player.password = password.substr(0, 32);
        this.player.email = email.substr(0, 128).toLowerCase();

        if (this.introduced) return;

        if (this.world.playerInWorld(this.player.username)) {
            this.connection.sendUTF8('loggedin');
            this.connection.close('Player already logged in..');

            return;
        }

        if (config.overrideAuth) {
            this.database.login(this.player);

            return;
        }

        if (config.offlineMode) {
            const creator = new Creator(null);

            this.player.load(Creator.getFullData(this.player));
            this.player.intro();

            return;
        }

        this.introduced = true;

        if (isRegistering) {
            this.database.exists(this.player, (result) => {
                if (result.exists) {
                    this.connection.sendUTF8(`${result.type}exists`);
                    this.connection.close(`${result.type} is not available.`);
                } else this.database.register(this.player);
            });
        } else if (isGuest) {
            this.player.username = `Guest${Utils.randomInt(0, 2000000)}`;
            this.player.password = null;
            this.player.email = null;
            this.player.isGuest = true;

            this.database.login(this.player);
        } else {
            this.database.verify(this.player, (result) => {
                if (result.status === 'success') {
                    this.database.login(this.player);
                } else {
                    this.connection.sendUTF8('invalidlogin');
                    this.connection.close(
                        `Wrong password entered for: ${this.player.username}`
                    );
                }
            });
        }
    }

    handleReady(message) {
        const isReady = message.shift();
        const preloadedData = message.shift();
        const userAgent = message.shift();

        if (!isReady) return;

        if (this.player.regionsLoaded.length > 0 && !preloadedData) {
            this.player.regionsLoaded = [];
        }

        this.player.ready = true;

        this.world.region.handle(this.player);
        this.world.region.push(this.player);

        this.player.sendEquipment();
        this.player.loadInventory();
        this.player.loadQuests();

        if (this.world.map.isOutOfBounds(this.player.x, this.player.y)) {
            this.player.setPosition(50, 89);
        }

        if (this.player.userAgent !== userAgent) {
            this.player.userAgent = userAgent;

            this.player.regionsLoaded = [];
            this.player.updateRegion(true);
        }

        this.player.save();

        if (this.player.readyCallback) this.player.readyCallback();

        this.player.sync();
    }

    handleWho(message) {
        _.each(message.shift(), (id) => {
            const entity = this.world.getEntityByInstance(id);

            if (!entity || entity.dead) return;

            /* We handle player-specific entity statuses here. */

            // Entity is an area-based mob
            if (entity.area) entity.specialState = 'area';

            if (this.player.quests.isQuestNPC(entity)) {
                entity.specialState = 'questNpc';
            }

            if (this.player.quests.isQuestMob(entity)) {
                entity.specialState = 'questMob';
            }

            if (entity.miniboss) {
                entity.specialState = 'miniboss';
                entity.customScale = 1.25;
            }

            if (entity.boss) entity.specialState = 'boss';

            // if (this.player.quests.isAchievementNPC(entity))
            //    entity.specialState = 'achievementNpc';

            this.player.send(new Messages.Spawn(entity));
        });
    }

    handleEquipment(message) {
        const opcode = message.shift();

        switch (opcode) {
            case Packets.EquipmentOpcode.Unequip:
                const type = message.shift();

                if (!this.player.inventory.hasSpace()) {
                    this.player.send(
                        new Messages.Notification(
                            Packets.NotificationOpcode.Text,
                            'You do not have enough space in your inventory.'
                        )
                    );

                    return;
                }

                switch (type) {
                    case 'weapon':
                        if (!this.player.hasWeapon()) return;

                        this.player.inventory.add(this.player.weapon.getItem());
                        this.player.setWeapon(-1, -1, -1, -1);

                        break;

                    case 'armour':
                        if (
                            this.player.hasArmour() &&
                            this.player.armour.id === 114
                        ) {
                            return;
                        }

                        this.player.inventory.add(this.player.armour.getItem());
                        this.player.setArmour(114, 1, -1, -1);

                        break;

                    case 'pendant':
                        if (!this.player.hasPendant()) return;

                        this.player.inventory.add(
                            this.player.pendant.getItem()
                        );
                        this.player.setPendant(-1, -1, -1, -1);

                        break;

                    case 'ring':
                        if (!this.player.hasRing()) return;

                        this.player.inventory.add(this.player.ring.getItem());
                        this.player.setRing(-1, -1, -1, -1);

                        break;

                    case 'boots':
                        if (!this.player.hasBoots()) return;

                        this.player.inventory.add(this.player.boots.getItem());
                        this.player.setBoots(-1, -1, -1, -1);

                        break;
                }

                this.player.send(
                    new Messages.Equipment(Packets.EquipmentOpcode.Unequip, [
                        type,
                    ])
                );
                this.player.sync();

                break;
        }
    }

    handleMovement(message) {
        const opcode = message.shift();
        let orientation;

        if (!this.player || this.player.dead) return;

        switch (opcode) {
            case Packets.MovementOpcode.Request:
                const requestX = message.shift();
                const requestY = message.shift();
                const playerX = message.shift();
                const playerY = message.shift();

                if (this.preventNoClip(requestX, requestY)) {
                    this.player.guessPosition(requestX, requestY);
                }

                this.player.movementStart = new Date().getTime();

                break;

            case Packets.MovementOpcode.Started:
                const selectedX = message.shift();
                const selectedY = message.shift();
                const pX = message.shift();
                const pY = message.shift();
                const movementSpeed = message.shift();

                if (
                    !movementSpeed ||
                    movementSpeed !== this.player.movementSpeed
                ) {
                    this.player.incrementCheatScore(1);
                }

                if (
                    pX !== this.player.x ||
                    pY !== this.player.y ||
                    this.player.stunned ||
                    !this.preventNoClip(selectedX, selectedY)
                ) {
                    return;
                }

                this.player.moving = true;

                break;

            case Packets.MovementOpcode.Step:
                const x = message.shift();
                const y = message.shift();

                if (this.player.stunned || !this.preventNoClip(x, y)) return;

                this.player.setPosition(x, y);

                break;

            case Packets.MovementOpcode.Stop:
                const posX = message.shift();
                const posY = message.shift();
                const id = message.shift();
                const hasTarget = message.shift();
                const entity = this.world.getEntityByInstance(id);

                if (!this.player.moving) {
                    if (config.debug) {
                        console.info(
                            `[Warning] Did not receive movement start packet for ${this.player.username}.`
                        );
                    }

                    this.player.incrementCheatScore(1);
                }

                orientation = message.shift();

                if (entity && entity.type === 'item') {
                    this.player.inventory.add(entity);
                }

                if (this.world.map.isDoor(posX, posY) && !hasTarget) {
                    const door = this.player.doors.getDoor(posX, posY);

                    if (
                        door &&
                        this.player.doors.getStatus(door) === 'closed'
                    ) {
                        return;
                    }

                    const destination = this.world.map.getDoorDestination(
                        posX,
                        posY
                    );

                    this.player.teleport(destination.x, destination.y, true);
                } else {
                    this.player.setPosition(posX, posY);
                    this.player.setOrientation(orientation);
                }

                this.player.moving = false;
                this.player.lastMovement = new Date().getTime();

                const diff =
                    this.player.lastMovement - this.player.movementStart;

                if (diff < this.player.movementSpeed) {
                    this.player.incrementCheatScore(1);
                }

                break;

            case Packets.MovementOpcode.Entity:
                const instance = message.shift();
                const entityX = message.shift();
                const entityY = message.shift();
                const oEntity = this.world.getEntityByInstance(instance);

                if (
                    !oEntity ||
                    (oEntity.x === entityX && oEntity.y === entityY)
                ) {
                    return;
                }

                oEntity.setPosition(entityX, entityY);

                if (oEntity.hasTarget()) oEntity.combat.forceAttack();

                break;

            case Packets.MovementOpcode.Orientate:
                orientation = message.shift();

                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: this.player.region,
                    message: new Messages.Movement(
                        Packets.MovementOpcode.Orientate,
                        [this.player.instance, orientation]
                    ),
                });

                break;

            case Packets.MovementOpcode.Freeze:
                /**
                 * Just used to prevent player from following entities in combat.
                 * This is primarily for the 'hold-position' functionality.
                 */

                this.player.frozen = message.shift();

                break;

            case Packets.MovementOpcode.Zone:
                const direction = message.shift();

                console.info(`Player zoned - ${direction}`);

                break;
        }
    }

    handleRequest(message) {
        const id = message.shift();

        if (id !== this.player.instance) return;

        this.world.region.push(this.player);
    }

    handleTarget(message) {
        const opcode = message.shift();
        const instance = message.shift();

        console.debug(`Targeted: ${instance}`);

        switch (opcode) {
            case Packets.TargetOpcode.Talk:
                const entity = this.world.getEntityByInstance(instance);

                if (!entity || !this.player.isAdjacent(entity)) return;

                this.player.cheatScore = 0;

                if (entity.type === 'chest') {
                    entity.openChest();

                    return;
                }

                if (entity.dead) return;

                if (this.player.npcTalkCallback) {
                    this.player.npcTalkCallback(entity);
                }

                break;

            case Packets.TargetOpcode.Attack:
                const target = this.world.getEntityByInstance(instance);

                if (
                    !target ||
                    target.dead ||
                    !this.canAttack(this.player, target)
                ) {
                    return;
                }

                this.player.cheatScore = 0;

                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: target.region,
                    message: new Messages.Combat(
                        Packets.CombatOpcode.Initiate,
                        {
                            attackerId: this.player.instance,
                            targetId: target.instance,
                        }
                    ),
                });

                break;

            case Packets.TargetOpcode.None:
                this.player.combat.stop();
                this.player.removeTarget();

                break;

            case Packets.TargetOpcode.Object:
                const object = this.globalObjects.getObject(instance);

                if (!object) return;

                const message = this.globalObjects.talk(object, this.player);

                this.world.push(Packets.PushOpcode.Player, {
                    player: this.player,
                    message: new Messages.Bubble({
                        id: instance,
                        text: message,
                        duration: 5000,
                        isObject: true,
                        info: {
                            id: instance,
                            x: object.x * 16,
                            y: object.y * 16 + 8,
                        },
                    }),
                });

                break;
        }
    }

    handleCombat(message) {
        const opcode = message.shift();

        switch (opcode) {
            case Packets.CombatOpcode.Initiate:
                const attacker = this.world.getEntityByInstance(
                    message.shift()
                );
                const target = this.world.getEntityByInstance(message.shift());

                if (
                    !target ||
                    target.dead ||
                    !attacker ||
                    attacker.dead ||
                    !this.canAttack(attacker, target)
                ) {
                    return;
                }

                attacker.setTarget(target);

                if (!attacker.combat.started) attacker.combat.forceAttack();
                else {
                    attacker.combat.start();

                    attacker.combat.attack(target);
                }

                if (target.combat) target.combat.addAttacker(attacker);

                break;
        }
    }

    handleProjectile(message) {
        const type = message.shift();

        switch (type) {
            case Packets.ProjectileOpcode.Impact:
                const projectile = this.world.getEntityByInstance(
                    message.shift()
                );
                const target = this.world.getEntityByInstance(message.shift());

                if (!target || target.dead || !projectile) return;

                this.world.handleDamage(
                    projectile.owner,
                    target,
                    projectile.damage
                );
                this.world.removeProjectile(projectile);

                if (
                    target.combat.started ||
                    target.dead ||
                    target.type !== 'mob'
                ) {
                    return;
                }

                target.begin(projectile.owner);

                break;
        }
    }

    handleNetwork(message) {
        const opcode = message.shift();

        switch (opcode) {
            case Packets.NetworkOpcode.Pong:
                console.info('Pingy pongy pung pong.');
                break;
        }
    }

    handleChat(message) {
        const text = sanitizer.escape(sanitizer.sanitize(message.shift()));

        if (!text || text.length < 1 || !/\S/.test(text)) return;

        if (text.charAt(0) === '/' || text.charAt(0) === ';') {
            this.commands.parse(text);
        } else {
            if (this.player.isMuted()) {
                this.player.send(
                    new Messages.Notification(
                        Packets.NotificationOpcode.Text,
                        'You are currently muted.'
                    )
                );

                return;
            }

            if (!this.player.canTalk) {
                this.player.send(
                    new Messages.Notification(
                        Packets.NotificationOpcode.Text,
                        'You are not allowed to talk for the duration of this event.'
                    )
                );

                return;
            }

            if (config.debug) console.info(`${this.player.username} - ${text}`);

            this.world.push(Packets.PushOpcode.Regions, {
                regionId: this.player.region,
                message: new Messages.Chat({
                    id: this.player.instance,
                    name: this.player.username,
                    withBubble: true,
                    text,
                    duration: 7000,
                }),
            });
        }
    }

    handleInventory(message) {
        const opcode = message.shift();
        let id;
        let ability;
        let abilityLevel;

        switch (opcode) {
            case Packets.InventoryOpcode.Remove:
                const item = message.shift();
                let count;

                if (!item) return;

                if (item.count > 1) count = message.shift();

                id = Items.stringToId(item.string);

                const iSlot = this.player.inventory.slots[item.index];

                if (iSlot.id < 1) return;

                if (count > iSlot.count) count = iSlot.count;

                ability = iSlot.ability;
                abilityLevel = iSlot.abilityLevel;

                if (
                    this.player.inventory.remove(
                        id,
                        count || item.count,
                        item.index
                    )
                ) {
                    this.world.dropItem(
                        id,
                        count || 1,
                        this.player.x,
                        this.player.y,
                        ability,
                        abilityLevel
                    );
                }

                break;

            case Packets.InventoryOpcode.Select:
                const index = message.shift();
                const slot = this.player.inventory.slots[index];
                const { string } = slot;
                const sCount = slot.count;

                ability = slot.ability;
                abilityLevel = slot.abilityLevel;

                if (!slot || slot.id < 1) return;

                id = Items.stringToId(slot.string);

                if (slot.equippable) {
                    if (!this.player.canEquip(string)) return;

                    this.player.inventory.remove(id, slot.count, slot.index);

                    this.player.equip(string, sCount, ability, abilityLevel);
                } else if (slot.edible) {
                    this.player.inventory.remove(id, 1, slot.index);

                    this.player.eat(id);
                }

                break;
        }
    }

    handleBank(message) {
        const opcode = message.shift();

        switch (opcode) {
            case Packets.BankOpcode.Select:
                const type = message.shift();
                const index = message.shift();
                const isBank = type === 'bank';

                if (isBank) {
                    const bankSlot = this.player.bank.slots[index];

                    if (bankSlot.id < 1) return;

                    // Infinite stacks move all at onces, otherwise move one by one.
                    const moveAmount =
                        Items.maxStackSize(bankSlot.id) === -1
                            ? bankSlot.count
                            : 1;

                    if (this.player.inventory.add(bankSlot, moveAmount)) {
                        this.player.bank.remove(bankSlot.id, moveAmount, index);
                    }
                } else {
                    const inventorySlot = this.player.inventory.slots[index];

                    if (inventorySlot.id < 1) return;

                    if (
                        this.player.bank.add(
                            inventorySlot.id,
                            inventorySlot.count,
                            inventorySlot.ability,
                            inventorySlot.abilityLevel
                        )
                    ) {
                        this.player.inventory.remove(
                            inventorySlot.id,
                            inventorySlot.count,
                            index
                        );
                    }
                }

                break;
        }
    }

    handleRespawn(message) {
        const instance = message.shift();

        if (this.player.instance !== instance) return;

        const spawn = this.player.getSpawn();

        this.player.dead = false;
        this.player.setPosition(spawn.x, spawn.y);

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.player.region,
            message: new Messages.Spawn(this.player),
            ignoreId: this.player.instance,
        });

        this.player.send(
            new Messages.Respawn(
                this.player.instance,
                this.player.x,
                this.player.y
            )
        );

        this.player.revertPoints();
    }

    handleTrade(message) {
        const opcode = message.shift();
        const oPlayer = this.world.getEntityByInstance(message.shift());

        if (!oPlayer || !opcode) return;

        switch (opcode) {
            case Packets.TradeOpcode.Request:
                break;

            case Packets.TradeOpcode.Accept:
                break;

            case Packets.TradeOpcode.Decline:
                break;
        }
    }

    handleEnchant(message) {
        const opcode = message.shift();

        switch (opcode) {
            case Packets.EnchantOpcode.Select:
                const index = message.shift();
                const item = this.player.inventory.slots[index];
                let type = 'item';

                if (item.id < 1) return;

                if (Items.isShard(item.id)) type = 'shards';

                this.player.enchant.add(type, item);

                break;

            case Packets.EnchantOpcode.Remove:
                this.player.enchant.remove(message.shift());

                break;

            case Packets.EnchantOpcode.Enchant:
                this.player.enchant.enchant();

                break;
        }
    }

    handleClick(message) {
        const type = message.shift();
        const state = message.shift();

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
    }

    handleWarp(message) {
        const id = parseInt(message.shift()) - 1;

        if (this.player.warp) this.player.warp.warp(id);
    }

    handleShop(message) {
        const opcode = message.shift();
        const npcId = message.shift();

        switch (opcode) {
            case Packets.ShopOpcode.Buy:
                const buyId = message.shift();
                const amount = message.shift();

                if (!buyId || !amount) {
                    this.player.notify('Incorrect purchase packets.');

                    return;
                }

                console.debug(`Received Buy: ${npcId} ${buyId} ${amount}`);

                this.world.shops.buy(this.player, npcId, buyId, amount);

                break;

            case Packets.ShopOpcode.Sell:
                if (!this.player.selectedShopItem) {
                    this.player.notify('No item has been selected.');

                    return;
                }

                this.world.shops.sell(
                    this.player,
                    npcId,
                    this.player.selectedShopItem.index
                );

                break;

            case Packets.ShopOpcode.Select:
                let slotId = message.shift();

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

                const item = this.player.inventory.slots[slotId];

                if (!item || item.id < 1) return;

                if (this.player.selectedShopItem) {
                    this.world.shops.remove(this.player);
                }

                const currency = this.world.shops.getCurrency(npcId);

                if (!currency) return;

                this.player.send(
                    new Messages.Shop(Packets.ShopOpcode.Select, {
                        id: npcId,
                        slotId,
                        currency: Items.idToString(currency),
                        price: this.world.shops.getSellPrice(npcId, item.id),
                    })
                );

                this.player.selectedShopItem = {
                    id: npcId,
                    index: item.index,
                };

                console.debug(`Received Select: ${npcId} ${slotId}`);

                break;

            case Packets.ShopOpcode.Remove:
                this.world.shops.remove(this.player);

                break;
        }
    }

    handleCamera(message) {
        console.info(`${this.player.x} ${this.player.y}`);

        this.player.cameraArea = null;
        this.player.handler.detectCamera(this.player.x, this.player.y);
    }

    canAttack(attacker, target) {
        /**
         * Used to prevent client-sided manipulation. The client will send the packet to start combat
         * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
         */

        if (attacker.type === 'mob' || target.type === 'mob') return true;

        return (
            attacker.type === 'player' &&
            target.type === 'player' &&
            attacker.pvp &&
            target.pvp
        );
    }

    preventNoClip(x, y) {
        const isMapColliding = this.world.map.isColliding(x, y);
        const isInstanceColliding = this.player.doors.hasCollision(x, y);

        if (isMapColliding || isInstanceColliding) {
            this.player.stopMovement(true);
            this.player.notify(
                'We have detected no-clipping in your client. Please submit a bug report.'
            );

            x =
                this.player.previousX < 0
                    ? this.player.x
                    : this.player.previousX;
            y =
                this.player.previousY < 0
                    ? this.player.y
                    : this.player.previousY;

            if (this.world.map.isColliding(x, y)) {
                const spawn = this.player.getSpawn();

                x = spawn.x;
                y = spawn.y;
            }

            this.player.teleport(x, y, false, true);

            return false;
        }

        return true;
    }
}

export default Incoming;
