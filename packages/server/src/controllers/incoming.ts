import _ from 'lodash';
import sanitizer from 'sanitizer';

import config from '@kaetram/common/config';
import { Modules, Opcodes, Packets } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Creator from '../database/mongodb/creator';
import { Chat, Combat, Movement, Notification, Spawn } from '../network/packets';
import Respawn from '../network/packets/respawn';
import Commands from './commands';

import type {
    LoginPacket,
    MovementPacket,
    ReadyPacket
} from '@kaetram/common/types/messages/incoming';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type { SlotType } from '@kaetram/common/types/slot';
import type Character from '../game/entity/character/character';
import type Mob from '../game/entity/character/mob/mob';
import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type NPC from '../game/entity/npc/npc';
import type Chest from '../game/entity/objects/chest';
import type Item from '../game/entity/objects/item';
import type Projectile from '../game/entity/objects/projectile';
import Connection from '../network/connection';
import World from '../game/world';
import Entities from './entities';
import MongoDB from '../database/mongodb/mongodb';

type PacketData = (string | number | boolean | string[])[];

export default class Incoming {
    private world: World;
    private connection: Connection;
    private entities: Entities;
    private database: MongoDB;
    private commands: Commands;

    public constructor(private player: Player) {
        this.connection = player.connection;
        this.world = player.world;
        this.entities = this.world.entities;
        this.database = player.database;
        this.commands = new Commands(player);

        this.connection.onMessage(([packet, message]) => {
            if (!Utils.validPacket(packet)) {
                log.error(`Non-existent packet received: ${packet} data: `);
                log.error(message);

                return;
            }

            player.refreshTimeout();

            // Prevent server from crashing due to a packet malfunction.
            try {
                switch (packet) {
                    case Packets.Login:
                        return this.handleLogin(message);
                    case Packets.Ready:
                        return this.handleReady(message);
                    case Packets.Who:
                        return this.handleWho(message);
                    case Packets.Equipment:
                        return this.handleEquipment(message);
                    case Packets.Movement:
                        return this.handleMovement(message);
                    case Packets.Request:
                        return this.handleRequest(message);
                    case Packets.Target:
                        return this.handleTarget(message);
                    case Packets.Combat:
                        return this.handleCombat(message);
                    case Packets.Projectile:
                        return this.handleProjectile(message);
                    case Packets.Network:
                        return this.handleNetwork(message);
                    case Packets.Chat:
                        return this.handleChat(message);
                    case Packets.Command:
                        return this.handleCommand(message);
                    case Packets.Container:
                        return this.handleContainer(message);
                    case Packets.Respawn:
                        return this.handleRespawn(message);
                    case Packets.Trade:
                        return this.handleTrade(message);
                    case Packets.Enchant:
                        return this.handleEnchant(message);
                    case Packets.Click:
                        return this.handleClick(message);
                    case Packets.Warp:
                        return this.handleWarp(message);
                    case Packets.Shop:
                        return this.handleShop(message);
                    case Packets.Camera:
                        return this.handleCamera(message);
                }
            } catch (error) {
                log.error(error);
            }
        });
    }

    /**
     * Handles the login process for Kaetram.
     * @param data The packet data for the login. Generally contains
     * username, password, (email if registering). If it's a guest login,
     * then we proceed with no username/password and no database saving.
     */

    private handleLogin(data: LoginPacket): void {
        let { opcode, username, password, email } = data;

        if (username) {
            // Format username by making it all lower case, shorter than 32 characters, and no spaces.
            this.player.username = username.toLowerCase().slice(0, 32).trim();

            if (password) this.player.password = password.slice(0, 32);
            if (email) this.player.email = email;

            // Reject connection if player is already logged in.
            if (this.world.isOnline(this.player.username))
                return this.connection.reject('loggedin');

            // Proceed directly to login with default player data if skip database is present.
            if (config.skipDatabase) return this.player.load(Creator.serializePlayer(this.player));
        }

        // Handle login for each particular case.
        switch (opcode) {
            case Opcodes.Login.Login:
                return this.database.login(this.player);

            case Opcodes.Login.Register:
                return this.database.register(this.player);

            case Opcodes.Login.Guest:
                this.player.isGuest = true; // Makes sure player doesn't get saved to database.
                this.player.username = `guest${Utils.counter}`; // Generate a random guest username.

                return this.player.load(Creator.serializePlayer(this.player));
        }
    }

    private handleReady(data: ReadyPacket): void {
        let { hasMapData, userAgent } = data;

        if (this.player.regionsLoaded.length > 0 && !hasMapData) this.player.regionsLoaded = [];

        this.player.loadEquipment();
        this.player.loadInventory();
        this.player.loadBank();
        this.player.loadQuests();

        //this.world.regions.syncRegions(this.player);

        if (this.world.map.isOutOfBounds(this.player.x, this.player.y))
            this.player.setPosition(50, 89);

        if (this.player.userAgent !== userAgent) {
            this.player.userAgent = userAgent;

            this.player.regionsLoaded = [];
            this.player.updateRegion(true);
        }

        this.world.api.sendChat(Utils.formatName(this.player.username), 'has logged in!');
        this.world.discord.sendMessage(this.player.username, 'has logged in!');

        this.player.readyCallback?.();

        this.player.ready = true;
    }

    private handleWho(message: string[]): void {
        _.each(message, (id: string) => {
            let entity = this.entities.get(id);

            if (!entity || entity.dead) return;

            /* We handle player-specific entity statuses here. */

            // Entity is an area-based mob
            // if (entity.area) entity.specialState = 'area';

            // if (this.player.quests.isQuestNPC(entity)) entity.specialState = 'questNpc';

            // if (this.player.quests.isQuestMob(entity)) entity.specialState = 'questMob';

            // if (entity.miniboss) {
            //     entity.specialState = 'miniboss';
            //     entity.customScale = 1.25;
            // }

            // if (entity.boss) entity.specialState = 'boss';

            // if (this.player.quests.isAchievementNPC(entity))
            //    entity.specialState = 'achievementNpc';

            this.player.send(new Spawn(entity));
        });
    }

    private handleEquipment(packet: PacketData): void {
        let opcode = packet.shift() as Opcodes.Equipment,
            type = packet.shift() as Modules.Equipment;

        switch (opcode) {
            case Opcodes.Equipment.Unequip:
                return this.player.equipment.unequip(type);
        }

        // let [opcode, type] = message;

        // switch (opcode) {
        //     case Opcodes.Equipment.Unequip: {
        //         if (!this.player.inventory.hasSpace()) {
        //             this.player.send(
        //                 new Notification(Opcodes.Notification.Text, {
        //                     message: 'You do not have enough space in your inventory.'
        //                 })
        //             );
        //             return;
        //         }

        //         // switch (type) {
        //         //     case 'weapon':
        //         //         if (!this.player.hasWeapon()) return;

        //         //         this.player.inventory.add(this.player.weapon.getItem());
        //         //         this.player.setWeapon(-1, -1, -1, -1);

        //         //         break;

        //         //     case 'armour':
        //         //         if (this.player.hasArmour() && this.player.armour.id === 114) return;

        //         //         this.player.inventory.add(this.player.armour.getItem());
        //         //         this.player.setArmour(114, 1, -1, -1);

        //         //         break;

        //         //     case 'pendant':
        //         //         if (!this.player.hasPendant()) return;

        //         //         this.player.inventory.add(this.player.pendant.getItem());
        //         //         this.player.setPendant(-1, -1, -1, -1);

        //         //         break;

        //         //     case 'ring':
        //         //         if (!this.player.hasRing()) return;

        //         //         this.player.inventory.add(this.player.ring.getItem());
        //         //         this.player.setRing(-1, -1, -1, -1);

        //         //         break;

        //         //     case 'boots':
        //         //         if (!this.player.hasBoots()) return;

        //         //         this.player.inventory.add(this.player.boots.getItem());
        //         //         this.player.setBoots(-1, -1, -1, -1);

        //         //         break;
        //         // }

        //         this.player.send(new Equipment(Opcodes.Equipment.Unequip, type));

        //         break;
        //     }
        // }
    }

    private handleMovement(data: MovementPacket): void {
        let {
                opcode,
                requestX,
                requestY,
                playerX,
                playerY,
                movementSpeed,
                hasTarget,
                targetInstance,
                orientation,
                frozen
            } = data,
            entity: Entity,
            door: ProcessedDoor,
            diff = 0;

        if (this.player.dead) return;

        switch (opcode) {
            case Opcodes.Movement.Request:
                this.preventNoClip(requestX!, requestY!);

                this.player.movementStart = Date.now();

                break;

            case Opcodes.Movement.Started:
                if (movementSpeed !== this.player.movementSpeed) this.player.incrementCheatScore(1);

                if (
                    playerX !== this.player.x ||
                    playerY !== this.player.y ||
                    this.player.stunned ||
                    !this.preventNoClip(requestX!, requestY!)
                )
                    return;

                if (!targetInstance) this.player.combat.stop();

                this.player.moving = true;

                break;

            case Opcodes.Movement.Step:
                if (this.player.stunned || !this.preventNoClip(playerX!, playerY!)) return;

                this.player.setPosition(playerX!, playerY!);

                break;

            case Opcodes.Movement.Stop:
                entity = this.entities.get(targetInstance!);

                if (!this.player.moving) {
                    log.warning(`Didn't receive movement start packet: ${this.player.username}.`);

                    this.player.incrementCheatScore(1);
                }

                if (entity?.isItem()) this.player.inventory.add(entity as Item);

                if (this.world.map.isDoor(playerX!, playerY!) && !hasTarget) {
                    door = this.world.map.getDoor(playerX!, playerY!);

                    this.player.doorCallback?.(door);
                } else {
                    this.player.setPosition(playerX!, playerY!);
                    this.player.setOrientation(orientation!);
                }

                this.player.moving = false;
                this.player.lastMovement = Date.now();

                diff = this.player.lastMovement - this.player.movementStart;

                if (diff < this.player.movementSpeed) this.player.incrementCheatScore(1);

                break;

            case Opcodes.Movement.Entity:
                entity = this.entities.get(targetInstance!) as Character;

                if (!entity || (entity.x === requestX && entity.y === requestY)) return;

                entity.setPosition(requestX!, requestY!);

                //if ((entity as Character).hasTarget()) entity.combat.forceAttack();

                break;

            case Opcodes.Movement.Orientate:
                log.debug(`Unhandled Movement.Orientate: ${this.player.username}.`);
                // this.player.sendToRegions(
                //     new Movement(Opcodes.Movement.Orientate, [this.player.instance, orientation])
                // );

                break;

            case Opcodes.Movement.Freeze:
                this.player.frozen = !!frozen;
                break;

            case Opcodes.Movement.Zone:
                log.debug(`Zoning orientation: ${orientation}`);
                break;
        }
    }

    private handleRequest(message: [string]): void {
        let [id] = message;

        if (id !== this.player.instance) return;

        //this.world.region.push(this.player);
    }

    private handleTarget(message: [Opcodes.Target, string]): void {
        let [opcode, instance] = message;

        log.debug(`Target [opcode]: ${instance} [${opcode}]`);

        switch (opcode) {
            case Opcodes.Target.Talk: {
                let entity = this.entities.get(instance);

                if (!entity || !this.player.isAdjacent(entity)) return;

                this.player.cheatScore = 0;

                if (entity.isChest()) {
                    let chest = entity as unknown as Chest;
                    chest.openChest(this.player);
                    return;
                }

                if (entity.dead) return;

                this.player.npcTalkCallback?.(entity as NPC);

                break;
            }

            case Opcodes.Target.Attack: {
                let target = this.entities.get(instance) as Character;

                if (!target || target.dead || !this.canAttack(this.player, target)) return;

                this.player.cheatScore = 0;

                this.player.combat.attack(target);

                console.log('attack target yo');

                break;
            }

            case Opcodes.Target.None:
                // Nothing do to here.

                break;

            case Opcodes.Target.Object: {
                let target = this.entities.get(instance) as Character;

                this.player.setTarget(target);
                this.player.handleObject(instance);

                break;
            }
        }
    }

    private handleCombat(message: [Opcodes.Combat, string, string]): void {
        // let [opcode] = message;
        // switch (opcode) {
        //     case Opcodes.Combat.Initiate: {
        //         let attacker = this.entities.get(message[1]) as Character,
        //             target = this.entities.get(message[2]) as Character;
        //         if (
        //             !target ||
        //             target.dead ||
        //             !attacker ||
        //             attacker.dead ||
        //             !this.canAttack(attacker, target)
        //         )
        //             return;
        //         attacker.setTarget(target);
        //         if (!attacker.combat.started) attacker.combat.forceAttack();
        //         else {
        //             attacker.combat.start();
        //             attacker.combat.attack(target);
        //         }
        //         target.combat?.addAttacker(attacker);
        //         break;
        //     }
        // }
    }

    private handleProjectile(message: [Opcodes.Projectile, string, string]): void {
        // let [type] = message;
        // switch (type) {
        //     case Opcodes.Projectile.Impact: {
        //         let projectile = this.entities.get(message[1]) as Projectile,
        //             target = this.entities.get(message[2]) as Mob;
        //         if (!target || target.dead || !projectile) return;
        //         target.hit(projectile.damage);
        //         this.entities.remove(projectile);
        //         if (target.combat.started || target.dead || target.isMob()) return;
        //         target.combat.begin(projectile.owner!);
        //         break;
        //     }
        // }
    }

    private handleNetwork(message: [Opcodes.Network]): void {
        let [opcode] = message;

        switch (opcode) {
            case Opcodes.Network.Pong: {
                let time = Date.now();

                this.player.notify(`Latency of ${time - this.player.pingTime}ms`, 'red');

                break;
            }
        }
    }

    private handleChat(message: [string]): void {
        let text = sanitizer.escape(sanitizer.sanitize(message[0]));

        if (!text || text.length === 0 || !/\S/.test(text)) return;

        if (text.charAt(0) === '/' || text.charAt(0) === ';') this.commands.parse(text);
        else {
            if (this.player.isMuted()) {
                this.player.send(
                    new Notification(Opcodes.Notification.Text, {
                        message: 'You are currently muted.'
                    })
                );
                return;
            }

            if (!this.player.canTalk) {
                this.player.send(
                    new Notification(Opcodes.Notification.Text, {
                        message: 'You are not allowed to talk for the duration of this event.'
                    })
                );
                return;
            }

            log.debug(`${this.player.username} - ${text}`);

            if (config.discordEnabled)
                this.world.discord.sendMessage(this.player.username, text, undefined, true);

            if (config.hubEnabled)
                this.world.api.sendChat(Utils.formatName(this.player.username), text, true);

            this.player.sendToRegions(
                new Chat({
                    id: this.player.instance,
                    name: this.player.username,
                    withBubble: true,
                    text,
                    duration: 7000
                })
            );
        }
    }

    private handleCommand(message: [Opcodes.Command, Position]): void {
        let [opcode, position] = message;

        if (this.player.rights < 2) return;

        switch (opcode) {
            case Opcodes.Command.CtrlClick: {
                this.player.teleport(position.x, position.y, false, true);

                break;
            }
        }
    }

    private handleContainer(packet: PacketData): void {
        let type = packet.shift() as Modules.ContainerType,
            opcode = packet.shift() as Opcodes.Container,
            container =
                type === Modules.ContainerType.Inventory ? this.player.inventory : this.player.bank,
            index: number,
            count = 1;

        log.debug(`Received container packet: ${opcode} - ${type}.`);

        switch (opcode) {
            case Opcodes.Container.Drop:
                index = packet.shift() as number;
                count = packet.shift() as number;

                log.debug(`Removing slot index: ${index} - count: ${count}`);

                container.remove(index, count, true);

                break;

            case Opcodes.Container.Select:
                return this.player.handleContainerSelect(
                    container,
                    packet.shift() as number, // index
                    packet.shift() as SlotType // slot type if clicked in bank.
                );
        }

        // let [opcode] = message,
        //     id!: number,
        //     ability!: number,
        //     abilityLevel!: number;
        // switch (opcode) {
        //     case Opcodes.Inventory.Remove: {
        //         let item = message[1] as Slot,
        //             count!: number;
        //         if (!item) return;
        //         if (item.count > 1) count = message[2] as number;
        //         let iSlot = this.player.inventory.slots[item.index];
        //         if (iSlot.id < 1) return;
        //         if (count > iSlot.count) ({ count } = iSlot);
        //         ({ ability, abilityLevel } = iSlot);
        //         if (this.player.inventory.remove(id, count || item.count, item.index))
        //             this.entities.spawnItem(
        //                 item.string,
        //                 this.player.x,
        //                 this.player.y,
        //                 true,
        //                 count,
        //                 ability,
        //                 abilityLevel
        //             );
        //         break;
        //     }
        //     case Opcodes.Inventory.Select: {
        //         let index = message[1] as number,
        //             slot = this.player.inventory.slots[index],
        //             { string, count, equippable, edible } = slot;
        //         if (!slot || slot.id < 1) return;
        //         id = Items.stringToId(string)!;
        //         if (equippable) {
        //             if (!this.player.canEquip(string)) return;
        //             this.player.inventory.remove(id, count, slot.index);
        //             this.player.equipment.equip(id, count, ability, abilityLevel);
        //         } else if (edible) {
        //             this.player.inventory.remove(id, 1, slot.index);
        //             this.player.eat(id);
        //         }
        //         break;
        //     }
        // }
    }

    private handleBank(packet: PacketData): void {
        // let [opcode, type, index] = message;
        // switch (opcode) {
        //     case Opcodes.Bank.Select: {
        //         let isBank = type === 'bank';
        //         if (isBank) {
        //             let bank-slot = this.player.bank.getInfo(index);
        //             if (bank-slot.id < 1) return;
        //             // Infinite stacks move all at once, otherwise move one by one.
        //             let moveAmount = Items.maxStackSize(bank-slot.id) === -1 ? bank-slot.count : 1;
        //             bank-slot.count = moveAmount;
        //             if (this.player.inventory.add(bank-slot))
        //                 this.player.bank.remove(bank-slot.id, moveAmount, index);
        //         } else {
        //             let inventorySlot = this.player.inventory.slots[index];
        //             if (inventorySlot.id < 1) return;
        //             if (
        //                 this.player.bank.add(
        //                     inventorySlot.id,
        //                     inventorySlot.count,
        //                     inventorySlot.ability,
        //                     inventorySlot.abilityLevel
        //                 )
        //             )
        //                 this.player.inventory.remove(inventorySlot.id, inventorySlot.count, index);
        //         }
        //         break;
        //     }
        // }
    }

    private handleRespawn(message: [string]): void {
        let [instance] = message;

        if (this.player.instance !== instance) return;

        let spawn = this.player.getSpawn();

        this.player.dead = false;
        this.player.setPosition(spawn.x, spawn.y);

        this.player.sendToRegions(new Spawn(this.player), true);

        this.player.send(new Respawn(this.player));

        this.player.revertPoints();
    }

    private handleTrade(message: [Opcodes.Trade, string]): void {
        let [opcode] = message,
            oPlayer = this.entities.get(message[1]);

        if (!oPlayer) return;

        switch (opcode) {
            case Opcodes.Trade.Request:
                break;

            case Opcodes.Trade.Accept:
                break;

            case Opcodes.Trade.Decline:
                break;
        }
    }

    private handleEnchant(message: [Opcodes.Enchant, unknown]): void {
        // let [opcode] = message;
        // switch (opcode) {
        //     case Opcodes.Enchant.Select: {
        //         let index = message[1] as number,
        //             item = this.player.inventory.slots[index],
        //             type: EnchantType = 'item';
        //         if (item.id < 1) return;
        //         if (Items.isShard(item.id)) type = 'shards';
        //         this.player.enchant.add(type, item);
        //         break;
        //     }
        //     case Opcodes.Enchant.Remove:
        //         this.player.enchant.remove(message[1] as EnchantType);
        //         break;
        //     case Opcodes.Enchant.Enchant:
        //         this.player.enchant.enchant();
        //         break;
        // }
    }

    private handleClick(message: [string, boolean]): void {
        let [type, state] = message;

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

    private handleWarp(message: [string]): void {
        let id = parseInt(message[0]) - 1;

        this.player.warp?.warp(id);
    }

    private handleShop(message: [Opcodes.Shop, number, ...unknown[]]): void {
        // let [opcode, npcId] = message;
        // switch (opcode) {
        //     case Opcodes.Shop.Buy: {
        //         let buyId = message[2] as number,
        //             amount = message[3] as number;
        //         if (!buyId || !amount) {
        //             this.player.notify('Incorrect purchase packets.');
        //             return;
        //         }
        //         log.debug(`Received Buy: ${npcId} ${buyId} ${amount}`);
        //         this.world.shops.buy(this.player, npcId, buyId, amount);
        //         break;
        //     }
        //     case Opcodes.Shop.Sell:
        //         if (!this.player.selectedShopItem) {
        //             this.player.notify('No item has been selected.');
        //             return;
        //         }
        //         this.world.shops.sell(this.player, npcId, this.player.selectedShopItem.index);
        //         break;
        //     case Opcodes.Shop.Select: {
        //         let id = message[2] as string;
        //         if (!id) {
        //             this.player.notify('Incorrect purchase packets.');
        //             return;
        //         }
        //         let slotId = parseInt(id),
        //             /**
        //              * Though all this could be done client-sided
        //              * it's just safer to send it to the server to sanitize data.
        //              * It also allows us to add cheat checks in the future
        //              * or do some fancier stuff.
        //              */
        //             item = this.player.inventory.slots[slotId];
        //         if (!item || item.id < 1) return;
        //         if (this.player.selectedShopItem) this.world.shops.remove(this.player);
        //         let currency = this.world.shops.getCurrency(npcId);
        //         if (!currency) return;
        //         this.player.send(
        //             new Shop(Opcodes.Shop.Select, {
        //                 id: npcId,
        //                 slotId,
        //                 currency: Items.idToString(currency),
        //                 price: this.world.shops.getSellPrice(npcId, item.id)
        //             })
        //         );
        //         this.player.selectedShopItem = {
        //             id: npcId,
        //             index: item.index
        //         };
        //         log.debug(`Received Select: ${npcId} ${slotId}`);
        //         break;
        //     }
        //     case Opcodes.Shop.Remove:
        //         this.world.shops.remove(this.player);
        //         break;
        // }
    }

    private handleCamera(message: string[]): void {
        log.info(`${this.player.x} ${this.player.y}`);

        this.player.cameraArea = undefined;
        // TODO - Make this a server-side thing.
        // this.player.handler.detectCamera(this.player.x, this.player.y);
    }

    /**
     * Used to prevent client-sided manipulation. The client will send the packet to start combat
     * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
     */
    private canAttack(attacker: Character, target: Character): boolean {
        if (attacker.isMob() || target.isMob()) return true;

        return attacker.isPlayer() && target.isPlayer() && attacker.pvp && target.pvp;
    }

    private preventNoClip(x: number, y: number): boolean {
        let isMapColliding = this.world.map.isColliding(x, y);

        //if (this.world.map.getPositionObject(x, y)) return true;

        if (isMapColliding) {
            this.handleNoClip(x, y);
            return false;
        }

        return true;
    }

    public handleNoClip(x: number, y: number): void {
        this.player.stopMovement(true);
        this.player.notify(
            'We have detected no-clipping in your client. Please submit a bug report.'
        );

        x = this.player.oldX < 0 ? this.player.x : this.player.oldX;
        y = this.player.oldY < 0 ? this.player.y : this.player.oldY;

        if (this.world.map.isColliding(x, y)) {
            let spawn = this.player.getSpawn();

            ({ x, y } = spawn);
        }

        this.player.teleport(x, y, false, true);
    }
}
