import _ from 'lodash-es';
import sanitizer from 'sanitizer';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Connection from '../network/connection';
import World from '../game/world';
import Entities from './entities';
import MongoDB from '../database/mongodb/mongodb';
import Creator from '../database/mongodb/creator';
import Commands from './commands';

import { Spawn } from '../network/packets';
import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import type {
    AbilityPacket,
    ContainerPacket,
    EquipmentPacket,
    LoginPacket,
    MovementPacket,
    ProjectilePacket,
    ReadyPacket,
    StorePacket,
    WarpPacket
} from '@kaetram/common/types/messages/incoming';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type Character from '../game/entity/character/character';
import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type NPC from '../game/entity/npc/npc';
import type Chest from '../game/entity/objects/chest';
import type Item from '../game/entity/objects/item';
import type Projectile from '../game/entity/objects/projectile';

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
                    case Packets.List:
                        return this.player.updateEntityList();
                    case Packets.Who:
                        return this.handleWho(message);
                    case Packets.Equipment:
                        return this.handleEquipment(message);
                    case Packets.Movement:
                        return this.handleMovement(message);
                    case Packets.Target:
                        return this.handleTarget(message);
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
                    case Packets.Ability:
                        return this.handleAbility(message);
                    case Packets.Respawn:
                        return this.player.respawn();
                    case Packets.Trade:
                        return this.handleTrade(message);
                    case Packets.Enchant:
                        return this.handleEnchant(message);
                    case Packets.Warp:
                        return this.handleWarp(message);
                    case Packets.Store:
                        return this.handleStore(message);
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
        let { regionsLoaded, userAgent } = data;

        this.player.handleUserAgent(userAgent, regionsLoaded);

        this.player.handler.startUpdateInterval();

        this.player.ready = true;

        this.player.updateRegion();
        this.player.updateEntities();
        this.player.updateEntityList();

        this.world.api.sendChat(Utils.formatName(this.player.username), 'has logged in!');
        this.world.discord.sendMessage(this.player.username, 'has logged in!');

        if (this.player.isDead()) this.player.deathCallback?.();
    }

    /**
     * Packet contains list of entity instances that the client is requesting to spawn. The client compares
     * all the entities in the region to the entities it has spawned and the difference is sent here. The difference
     * represents the entities that the client doesn't have spawned.
     * @param message Contains a list of entity instances
     */

    private handleWho(message: string[]): void {
        _.each(message, (instance: string) => {
            let entity = this.entities.get(instance);

            if (!entity || entity.dead) return;

            /* We handle player-specific entity statuses here. */
            this.player.send(
                new Spawn(entity, entity.hasDisplayInfo(this.player) ? this.player : undefined)
            );
        });
    }

    /**
     * Handles equipment packet. Generally involved in unequipping.
     * @param data Contains information about which slot to unequip.
     */

    private handleEquipment(data: EquipmentPacket): void {
        switch (data.opcode) {
            case Opcodes.Equipment.Unequip:
                return this.player.equipment.unequip(data.type);
        }
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
            case Opcodes.Movement.Started:
                this.player.movementStart = Date.now();

                if (movementSpeed !== this.player.getMovementSpeed())
                    this.player.incrementCheatScore();

                if (playerX !== this.player.x || playerY !== this.player.y || this.player.stunned)
                    return;

                // Reset combat and skills every time there is movement.
                this.player.skills.stop();
                if (!targetInstance) this.player.combat.stop();

                this.player.moving = true;

                break;

            case Opcodes.Movement.Step:
                if (this.player.stunned) return;

                this.player.setPosition(playerX!, playerY!);

                break;

            case Opcodes.Movement.Stop:
                entity = this.entities.get(targetInstance!);

                if (!this.player.moving) {
                    log.warning(`Didn't receive movement start packet: ${this.player.username}.`);

                    this.player.incrementCheatScore();
                }

                this.player.setOrientation(orientation!);

                if (entity?.isItem()) this.player.inventory.add(entity as Item);

                if (this.world.map.isDoor(playerX!, playerY!) && !hasTarget) {
                    door = this.world.map.getDoor(playerX!, playerY!);

                    this.player.doorCallback?.(door);
                } else this.player.setPosition(playerX!, playerY!);

                this.player.moving = false;
                this.player.lastMovement = Date.now();

                if (!(this.player.oldX === playerX && this.player.oldY === playerY)) {
                    diff = this.player.lastMovement - this.player.movementStart;

                    if (diff < this.player.getMovementSpeed()) this.player.incrementCheatScore();
                }

                break;

            case Opcodes.Movement.Entity:
                entity = this.entities.get(targetInstance!) as Character;

                if (!entity) return;

                entity.setPosition(requestX!, requestY!);

                break;

            case Opcodes.Movement.Freeze:
                this.player.frozen = !!frozen;
                break;

            case Opcodes.Movement.Zone:
                log.debug(`Zoning orientation: ${orientation}`);
                break;
        }
    }

    private handleTarget(message: [Opcodes.Target, string]): void {
        let [opcode, instance] = message;

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

                break;
            }

            case Opcodes.Target.None:
                // Nothing do to here.

                break;

            case Opcodes.Target.Object:
                return this.player.handleObjectInteraction(instance);
        }
    }

    private handleProjectile(message: ProjectilePacket): void {
        let projectile = this.entities.get(message.instance) as Projectile,
            target = this.entities.get(message.target) as Character;

        if (!projectile) return log.warning(`[Incoming] Projectile not found: ${message.instance}`);
        if (!target) return log.warning(`[Incoming] Target not found: ${message.target}`);

        target.hit(projectile.hit.getDamage(), projectile.owner);

        this.entities.remove(projectile);
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

    /**
     * Receives a raw chat input from the client, sanitizes it, and parses
     * whether it is just a message or a command.
     * @param message Raw string input from the client.
     */

    private handleChat(message: [string]): void {
        // Message sanitization.
        let text = sanitizer.escape(sanitizer.sanitize(message[0]));

        if (!text || text.length === 0 || !/\S/.test(text)) return;

        // Handle commands if the prefix is / or ;
        if (text.charAt(0) === '/' || text.charAt(0) === ';') return this.commands.parse(text);

        this.player.chat(text);
    }

    private handleCommand(message: [Opcodes.Command, Position]): void {
        let [opcode, position] = message;

        if (this.player.rights < 2) return;

        switch (opcode) {
            case Opcodes.Command.CtrlClick: {
                this.player.teleport(position.x, position.y, true);

                break;
            }
        }
    }

    /**
     * Handles data associated with containers. This can include removing
     * or selecting items in the container. Depending on the type, we route
     * to the appropriate action.
     * @param packet Packet data containing type of container and opcode information.
     */

    private handleContainer(packet: ContainerPacket): void {
        let container =
            packet.type === Modules.ContainerType.Inventory
                ? this.player.inventory
                : this.player.bank;

        log.debug(`Received container packet: ${packet.opcode} - ${packet.type}`);

        switch (packet.opcode) {
            case Opcodes.Container.Select:
                return this.player.handleContainerSelect(
                    packet.type,
                    packet.index!,
                    packet.subType!
                );

            case Opcodes.Container.Remove:
                container.remove(packet.index!, undefined, true);
                return;

            case Opcodes.Container.Swap:
                container.swap(packet.index!, packet.tIndex!);
                break;
        }
    }

    /**
     * Handles incoming abilities actions from the client. Things such as using
     * an ability or moving one to a quick slot.
     * @param packet Contains infomration about which ability to use and where to move it.
     */

    private handleAbility(packet: AbilityPacket): void {
        switch (packet.opcode) {
            case Opcodes.Ability.Use:
                return this.player.abilities.use(packet.key);

            // case Opcodes.Ability.QuickSlot:
            //     return this.player.abilities...;
        }
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

    /**
     * Receives a warp packet from the client containing the
     * id of the warp selected. The server then verifies
     * the request (whether the player can warp there or not
     * and if the requirements are fulfilled) and sends a teleport
     * packet later on.
     * @param data Contains information about the warp (such as id).
     */

    private handleWarp(data: WarpPacket): void {
        this.world.warps.warp(this.player, data.id);
    }

    /**
     * Receives store interaction packets from the client. This contains
     * the store key, the index of the item selected, and how much of the
     * item we are purchasing/sellling/selecting.
     * @param data Store packet data containing the store key, index, and amount.
     */

    private handleStore(data: StorePacket): void {
        log.debug(`Received store packet: ${data.opcode}`);

        switch (data.opcode) {
            case Opcodes.Store.Buy:
                return this.world.stores.purchase(this.player, data.key, data.index, data.count);

            case Opcodes.Store.Sell:
                return this.world.stores.sell(this.player, data.key, data.index, data.count);

            case Opcodes.Store.Select:
                return this.world.stores.select(this.player, data.key, data.index, data.count);
        }
    }

    /**
     * Used to prevent client-sided manipulation. The client will send the packet to start combat
     * but if it was modified by a presumed hacker, it will simply cease when it arrives to this condition.
     */
    private canAttack(attacker: Character, target: Character): boolean {
        if (attacker.isMob() || target.isMob()) return true;

        return (
            attacker.isPlayer() &&
            target.isPlayer() &&
            attacker.pvp &&
            target.pvp &&
            attacker.team !== target.team
        );
    }
}
