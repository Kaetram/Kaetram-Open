import _ from 'lodash';
import sanitizer from 'sanitizer';

import Packets from '@kaetram/common/src/packets';

import config from '../../config';
import Creator from '../database/mongodb/creator';
import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import Slot from '../game/entity/character/player/containers/slot';
import Player from '../game/entity/character/player/player';
import Projectile from '../game/entity/objects/projectile';
import World from '../game/world';
import Messages from '../network/messages';
import Items from '../util/items';
import log from '../util/log';
import Utils from '../util/utils';
import Commands from './commands';
import Entities from './entities';
import NPC from '../game/entity/npc/npc';

import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import Chest from '../game/entity/objects/chest';
import Item from '../game/entity/objects/item';
import { EnchantType } from '../game/entity/character/player/enchant';

export default class Incoming {
    player: Player;
    connection: Connection;
    world: World;
    entities: Entities;
    database: MongoDB;
    commands: Commands;

    introduced: boolean;

    constructor(player: Player) {
        this.player = player as Player;
        this.connection = this.player.connection;
        this.world = this.player.world;
        this.entities = this.world.entities;
        this.database = this.player.database;
        this.commands = new Commands(this.player);

        this.connection.listen(([packet, message]) => {
            if (!Utils.validPacket(packet)) {
                log.error(`Non-existent packet received: ${packet} data: `);
                log.error(message);

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

                case Packets.Command:
                    this.handleCommand(message);
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

                case Packets.Camera:
                    this.handleCamera(message);
                    break;

                case Packets.Client:
                    this.handleClient(message);
                    break;
            }
        });
    }

    handleIntro(message: [number, string, string, string]): void {
        const [loginType, username, password] = message,
            isRegistering = loginType === Packets.IntroOpcode.Register,
            isGuest = loginType === Packets.IntroOpcode.Guest,
            email = isRegistering ? message[3] : '',
            formattedUsername = username
                ? username.charAt(0).toUpperCase() + username.toLowerCase().slice(1)
                : '';

        this.player.username = formattedUsername.slice(0, 32).trim().toLowerCase();
        this.player.password = password.slice(0, 32);
        this.player.email = email.slice(0, 128).toLowerCase();

        if (this.introduced) return;

        if (this.world.isOnline(this.player.username)) {
            this.connection.sendUTF8('loggedin');
            this.connection.close('Player already logged in..');
            return;
        }

        if (config.overrideAuth) {
            this.database.login(this.player);
            return;
        }

        if (config.offlineMode) {
            this.player.load(Creator.getFullData(this.player));
            this.player.intro();

            return;
        }

        this.introduced = true;

        if (isRegistering)
            this.database.exists(this.player, (result) => {
                if (result.exists) {
                    this.connection.sendUTF8(`${result.type}exists`);
                    this.connection.close(`${result.type} is not available.`);
                } else this.database.register(this.player);
            });
        else if (isGuest) {
            this.player.username = `Guest${Utils.randomInt(0, 2000000)}`;
            this.player.password = null;
            this.player.email = null;
            this.player.isGuest = true;

            this.database.login(this.player);
        } else
            this.database.verify(this.player, (result) => {
                if (result.status === 'success') this.database.login(this.player);
                else {
                    this.connection.sendUTF8('invalidlogin');
                    this.connection.close(`Wrong password entered for: ${this.player.username}`);
                }
            });
    }

    handleReady(message: [string, string, string]): void {
        const [isReady, preloadedData, userAgent] = message;

        if (!isReady) return;

        if (this.player.regionsLoaded.length > 0 && !preloadedData) this.player.regionsLoaded = [];

        this.player.ready = true;

        this.world.region.syncRegions(this.player);

        this.player.sendEquipment();

        this.player.loadProfessions();
        this.player.loadInventory();
        this.player.loadQuests();
        this.player.loadBank();

        if (this.world.map.isOutOfBounds(this.player.x, this.player.y))
            this.player.setPosition(50, 89);

        if (this.player.userAgent !== userAgent) {
            this.player.userAgent = userAgent;

            this.player.regionsLoaded = [];
            this.player.updateRegion(true);
        }

        if (this.player.new || config.offlineMode) {
            this.player.questsLoaded = true;
            this.player.achievementsLoaded = true;
        }

        this.player.save();

        if (config.discordEnabled)
            this.world.discord.sendWebhook(this.player.username, 'has logged in!');

        if (config.hubEnabled)
            this.world.api.sendChat(Utils.formatUsername(this.player.username), 'has logged in!');

        if (this.player.readyCallback) this.player.readyCallback();

        this.player.sync();
    }

    handleWho(message: string[]): void {
        _.each(message, (id: string) => {
            const entity = this.entities.get<Mob & NPC>(id);

            if (!entity || entity.dead) return;

            /* We handle player-specific entity statuses here. */

            // Entity is an area-based mob
            if (entity.area) entity.specialState = 'area';

            if (this.player.quests.isQuestNPC(entity)) entity.specialState = 'questNpc';

            if (this.player.quests.isQuestMob(entity)) entity.specialState = 'questMob';

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

    handleEquipment(message: [number, string]): void {
        const [opcode, type] = message;

        switch (opcode) {
            case Packets.EquipmentOpcode.Unequip: {
                if (!this.player.inventory.hasSpace()) {
                    this.player.send(
                        new Messages.Notification(Packets.NotificationOpcode.Text, {
                            message: 'You do not have enough space in your inventory.'
                        })
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
                        if (this.player.hasArmour() && this.player.armour.id === 114) return;

                        this.player.inventory.add(this.player.armour.getItem());
                        this.player.setArmour(114, 1, -1, -1);

                        break;

                    case 'pendant':
                        if (!this.player.hasPendant()) return;

                        this.player.inventory.add(this.player.pendant.getItem());
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

                this.player.send(new Messages.Equipment(Packets.EquipmentOpcode.Unequip, [type]));

                break;
            }
        }
    }

    handleMovement(message: [number, ...unknown[]]): void {
        const [opcode] = message;
        let orientation: number;

        if (!this.player || this.player.dead) return;

        switch (opcode) {
            case Packets.MovementOpcode.Request: {
                const requestX = message[1] as number,
                    requestY = message[2] as number;

                this.preventNoClip(requestX, requestY);

                this.player.movementStart = Date.now();

                break;
            }

            case Packets.MovementOpcode.Started: {
                const selectedX = message[1] as number,
                    selectedY = message[2] as number,
                    pX = message[3] as number,
                    pY = message[4] as number,
                    movementSpeed = message[5] as number,
                    targetId = message[6] as number;

                if (!movementSpeed || movementSpeed !== this.player.movementSpeed)
                    this.player.incrementCheatScore(1);

                if (
                    pX !== this.player.x ||
                    pY !== this.player.y ||
                    this.player.stunned ||
                    !this.preventNoClip(selectedX, selectedY)
                )
                    return;

                if (!targetId) {
                    this.player.removeTarget();
                    this.player.combat.stop();
                }

                this.player.moving = true;

                break;
            }

            case Packets.MovementOpcode.Step: {
                const x = message[1] as number,
                    y = message[2] as number;

                if (this.player.stunned || !this.preventNoClip(x, y)) return;

                this.player.setPosition(x, y);

                break;
            }

            case Packets.MovementOpcode.Stop: {
                const posX = message[1] as number,
                    posY = message[2] as number,
                    id = message[3] as string,
                    hasTarget = message[4] as number,
                    entity = this.entities.get(id);

                if (!this.player.moving) {
                    log.debug(`Did not receive movement start packet for ${this.player.username}.`);

                    this.player.incrementCheatScore(1);
                }

                orientation = message[5] as number;

                if (entity && entity.type === 'item') this.player.inventory.add(entity as Item);

                if (this.world.map.isDoor(posX, posY) && !hasTarget) {
                    const door = this.player.doors.getDoor(posX, posY);

                    if (door && this.player.doors.isClosed(door)) return;

                    const destination = this.world.map.getDoorByPosition(posX, posY);

                    this.player.teleport(destination.x, destination.y, true);
                } else {
                    this.player.setPosition(posX, posY);
                    this.player.setOrientation(orientation);
                }

                this.player.moving = false;
                this.player.lastMovement = Date.now();

                const diff = this.player.lastMovement - this.player.movementStart;

                if (diff < this.player.movementSpeed) this.player.incrementCheatScore(1);

                break;
            }

            case Packets.MovementOpcode.Entity: {
                const instance = message[1] as string,
                    entityX = message[2] as number,
                    entityY = message[3] as number,
                    oEntity = this.entities.get<Character>(instance);

                if (!oEntity || (oEntity.x === entityX && oEntity.y === entityY)) return;

                oEntity.setPosition(entityX, entityY);

                if (oEntity.hasTarget()) oEntity.combat.forceAttack();

                break;
            }

            case Packets.MovementOpcode.Orientate:
                orientation = message[1] as number;

                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: this.player.region,
                    message: new Messages.Movement(Packets.MovementOpcode.Orientate, [
                        this.player.instance,
                        orientation
                    ])
                });

                break;

            case Packets.MovementOpcode.Freeze:
                /**
                 * Just used to prevent player from following entities in combat.
                 * This is primarily for the 'hold-position' functionality.
                 */

                this.player.frozen = message[1] as boolean;

                break;

            case Packets.MovementOpcode.Zone: {
                const direction = message[1] as number;

                log.debug(`Zoning detected, direction: ${direction}.`);

                break;
            }
        }
    }

    handleRequest(message: [string]): void {
        let [id] = message;

        if (id !== this.player.instance) return;

        this.world.region.push(this.player);
    }

    handleTarget(message: [number, string]): void {
        let [opcode, instance] = message;

        log.debug(`Target [opcode]: ${instance} [${opcode}]`);

        switch (opcode) {
            case Packets.TargetOpcode.Talk: {
                let entity = this.entities.get(instance);

                if (!entity || !this.player.isAdjacent(entity)) return;

                this.player.cheatScore = 0;

                if (entity.type === 'chest') {
                    const chest = entity as Chest;
                    chest.openChest(this.player);
                    return;
                }

                if (entity.dead) return;

                if (this.player.npcTalkCallback) this.player.npcTalkCallback(entity as NPC);

                break;
            }

            case Packets.TargetOpcode.Attack: {
                const target = this.entities.get<Character>(instance);

                if (!target || target.dead || !this.canAttack(this.player, target)) return;

                this.player.cheatScore = 0;

                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: target.region,
                    message: new Messages.Combat(Packets.CombatOpcode.Initiate, {
                        attackerId: this.player.instance,
                        targetId: target.instance
                    })
                });

                break;
            }

            case Packets.TargetOpcode.None:
                // Nothing do to here.

                break;

            case Packets.TargetOpcode.Object: {
                const target = this.entities.get<Character>(instance);

                this.player.setTarget(target);
                this.player.handleObject(instance);

                break;
            }
        }
    }

    handleCombat(message: [number, string, string]): void {
        const [opcode] = message;

        switch (opcode) {
            case Packets.CombatOpcode.Initiate: {
                const attacker = this.entities.get<Character>(message[1]),
                    target = this.entities.get<Character>(message[2]);

                if (
                    !target ||
                    target.dead ||
                    !attacker ||
                    attacker.dead ||
                    !this.canAttack(attacker, target)
                )
                    return;

                attacker.setTarget(target);

                if (!attacker.combat.started) attacker.combat.forceAttack();
                else {
                    attacker.combat.start();

                    attacker.combat.attack(target);
                }

                target.combat?.addAttacker(attacker);

                break;
            }
        }
    }

    handleProjectile(message: [number, string, string]): void {
        const [type] = message;

        switch (type) {
            case Packets.ProjectileOpcode.Impact: {
                const projectile = this.entities.get<Projectile>(message[1]),
                    target = this.entities.get<Mob>(message[2]);

                if (!target || target.dead || !projectile) return;

                this.world.handleDamage(projectile.owner, target, projectile.damage);
                this.entities.remove(projectile);

                if (target.combat.started || target.dead || target.type !== 'mob') return;

                target.combat.begin(projectile.owner);

                break;
            }
        }
    }

    handleNetwork(message: [number]): void {
        const [opcode] = message;

        switch (opcode) {
            case Packets.NetworkOpcode.Pong: {
                const time = Date.now();

                this.player.notify(`Latency of ${time - this.player.pingTime}ms`, 'red');

                break;
            }
        }
    }

    handleChat(message: [string]): void {
        const text = sanitizer.escape(sanitizer.sanitize(message[0]));

        if (!text || text.length === 0 || !/\S/.test(text)) return;

        if (text.charAt(0) === '/' || text.charAt(0) === ';') this.commands.parse(text);
        else {
            if (this.player.isMuted()) {
                this.player.send(
                    new Messages.Notification(Packets.NotificationOpcode.Text, {
                        message: 'You are currently muted.'
                    })
                );
                return;
            }

            if (!this.player.canTalk) {
                this.player.send(
                    new Messages.Notification(Packets.NotificationOpcode.Text, {
                        message: 'You are not allowed to talk for the duration of this event.'
                    })
                );
                return;
            }

            log.debug(`${this.player.username} - ${text}`);

            if (config.discordEnabled)
                this.world.discord.sendWebhook(this.player.username, text, true);

            if (config.hubEnabled)
                this.world.api.sendChat(Utils.formatUsername(this.player.username), text, true);

            this.world.push(Packets.PushOpcode.Regions, {
                regionId: this.player.region,
                message: new Messages.Chat({
                    id: this.player.instance,
                    name: this.player.username,
                    withBubble: true,
                    text,
                    duration: 7000
                })
            });
        }
    }

    handleCommand(message: [number, Pos]): void {
        const [opcode, position] = message;

        if (this.player.rights < 2) return;

        switch (opcode) {
            case Packets.CommandOpcode.CtrlClick: {
                this.player.teleport(position.x, position.y, false, true);

                break;
            }
        }
    }

    handleInventory(message: [number, ...unknown[]]): void {
        const [opcode] = message;
        let id: number, ability: number, abilityLevel: number;

        switch (opcode) {
            case Packets.InventoryOpcode.Remove: {
                const item = message[1] as Slot;
                let count: number;

                if (!item) return;

                if (item.count > 1) count = message[2] as number;

                id = Items.stringToId(item.string);

                const iSlot = this.player.inventory.slots[item.index];

                if (iSlot.id < 1) return;

                if (count > iSlot.count) ({ count } = iSlot);

                ({ ability, abilityLevel } = iSlot);

                if (this.player.inventory.remove(id, count ? count : item.count, item.index))
                    this.entities.dropItem(
                        id,
                        count ? count : 1,
                        this.player.x,
                        this.player.y,
                        ability,
                        abilityLevel
                    );

                break;
            }

            case Packets.InventoryOpcode.Select: {
                const index = message[1] as number,
                    slot = this.player.inventory.slots[index],
                    { string, count, equippable, edible } = slot;

                if (!slot || slot.id < 1) return;

                id = Items.stringToId(string);

                if (equippable) {
                    if (!this.player.canEquip(string)) return;

                    this.player.inventory.remove(id, count, slot.index);

                    this.player.equip(string, count, ability, abilityLevel);
                } else if (edible) {
                    this.player.inventory.remove(id, 1, slot.index);

                    this.player.eat(id);
                }

                break;
            }
        }
    }

    handleBank(message: [number, string, number]): void {
        const [opcode, type, index] = message;

        switch (opcode) {
            case Packets.BankOpcode.Select: {
                const isBank = type === 'bank';

                if (isBank) {
                    const bankSlot = this.player.bank.getInfo(index);

                    if (bankSlot.id < 1) return;

                    // Infinite stacks move all at once, otherwise move one by one.
                    const moveAmount = Items.maxStackSize(bankSlot.id) === -1 ? bankSlot.count : 1;

                    bankSlot.count = moveAmount;

                    if (this.player.inventory.add(bankSlot))
                        this.player.bank.remove(bankSlot.id, moveAmount, index);
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
                    )
                        this.player.inventory.remove(inventorySlot.id, inventorySlot.count, index);
                }

                break;
            }
        }
    }

    handleRespawn(message: [string]): void {
        const [instance] = message;

        if (this.player.instance !== instance) return;

        const spawn = this.player.getSpawn();

        this.player.dead = false;
        this.player.setPosition(spawn.x, spawn.y);

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.player.region,
            message: new Messages.Spawn(this.player),
            ignoreId: this.player.instance
        });

        this.player.send(
            new Messages.Respawn(this.player.instance, { x: this.player.x, y: this.player.y })
        );

        this.player.revertPoints();
    }

    handleTrade(message: [number, string]): void {
        const [opcode] = message,
            oPlayer = this.entities.get(message[1]);

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

    handleEnchant(message: [number, unknown]): void {
        const [opcode] = message;

        switch (opcode) {
            case Packets.EnchantOpcode.Select: {
                const index = message[1] as number,
                    item = this.player.inventory.slots[index];
                let type: EnchantType = 'item';

                if (item.id < 1) return;

                if (Items.isShard(item.id)) type = 'shards';

                this.player.enchant.add(type, item);

                break;
            }

            case Packets.EnchantOpcode.Remove:
                this.player.enchant.remove(message[1] as EnchantType);

                break;

            case Packets.EnchantOpcode.Enchant:
                this.player.enchant.enchant();

                break;
        }
    }

    handleClick(message: [string, boolean]): void {
        const [type, state] = message;

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

    handleWarp(message: [string]): void {
        const id = parseInt(message[0]) - 1;

        this.player.warp?.warp(id);
    }

    handleShop(message: [number, number, ...unknown[]]): void {
        const [opcode, npcId] = message;

        switch (opcode) {
            case Packets.ShopOpcode.Buy: {
                const buyId = message[2] as number,
                    amount = message[3] as number;

                if (!buyId || !amount) {
                    this.player.notify('Incorrect purchase packets.');
                    return;
                }

                log.debug(`Received Buy: ${npcId} ${buyId} ${amount}`);

                this.world.shops.buy(this.player, npcId, buyId, amount);

                break;
            }

            case Packets.ShopOpcode.Sell:
                if (!this.player.selectedShopItem) {
                    this.player.notify('No item has been selected.');
                    return;
                }

                this.world.shops.sell(this.player, npcId, this.player.selectedShopItem.index);

                break;

            case Packets.ShopOpcode.Select: {
                const id = message[2] as string;

                if (!id) {
                    this.player.notify('Incorrect purchase packets.');
                    return;
                }

                const slotId = parseInt(id),
                    /**
                     * Though all this could be done client-sided
                     * it's just safer to send it to the server to sanitize data.
                     * It also allows us to add cheat checks in the future
                     * or do some fancier stuff.
                     */

                    item = this.player.inventory.slots[slotId];

                if (!item || item.id < 1) return;

                if (this.player.selectedShopItem) this.world.shops.remove(this.player);

                const currency = this.world.shops.getCurrency(npcId);

                if (!currency) return;

                this.player.send(
                    new Messages.Shop(Packets.ShopOpcode.Select, {
                        id: npcId,
                        slotId,
                        currency: Items.idToString(currency),
                        price: this.world.shops.getSellPrice(npcId, item.id)
                    })
                );

                this.player.selectedShopItem = {
                    id: npcId,
                    index: item.index
                };

                log.debug(`Received Select: ${npcId} ${slotId}`);

                break;
            }

            case Packets.ShopOpcode.Remove:
                this.world.shops.remove(this.player);

                break;
        }
    }

    handleCamera(message: string[]): void {
        log.info(`${this.player.x} ${this.player.y}`);
        console.log(message);

        this.player.cameraArea = null;
        // TODO - Make this a server-side thing.
        // this.player.handler.detectCamera(this.player.x, this.player.y);
    }

    /**
     * Receive client information such as screen size, will be expanded
     * for more functionality when needed.
     */

    handleClient(message: [number, number]): void {
        const [canvasWidth, canvasHeight] = message;

        if (!canvasWidth || !canvasHeight) return;

        /**
         * The client is by default scaled to 3x the normal
         * tileSize of 16x16. So we are using 48x48 to find
         * a desireable region size.
         */

        this.player.regionWidth = Math.ceil(canvasWidth / 48);
        this.player.regionHeight = Math.ceil(canvasHeight / 48);
    }

    canAttack(attacker: Character, target: Character): boolean {
        /**
         * Used to prevent client-sided manipulation. The client will send the packet to start combat
         * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
         */

        if (attacker.type === 'mob' || target.type === 'mob') return true;

        return attacker.type === 'player' && target.type === 'player' && attacker.pvp && target.pvp;
    }

    preventNoClip(x: number, y: number): boolean {
        const isMapColliding = this.world.map.isColliding(x, y),
            isInstanceColliding = this.player.doors.hasCollision(x, y);

        if (this.world.map.getPositionObject(x, y)) return true;

        if (isMapColliding || isInstanceColliding) {
            this.handleNoClip(x, y);
            return false;
        }

        return true;
    }

    handleNoClip(x: number, y: number): void {
        this.player.stopMovement(true);
        this.player.notify(
            'We have detected no-clipping in your client. Please submit a bug report.'
        );

        x = this.player.previousX < 0 ? this.player.x : this.player.previousX;
        y = this.player.previousY < 0 ? this.player.y : this.player.previousY;

        if (this.world.map.isColliding(x, y)) {
            const spawn = this.player.getSpawn();

            ({ x, y } = spawn);
        }

        this.player.teleport(x, y, false, true);
    }
}
