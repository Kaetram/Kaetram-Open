import Commands from './commands';

import Creator from '../database/mongodb/creator';
import { Spawn } from '../network/packets';

import _ from 'lodash-es';
import sanitizer from 'sanitizer';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import Filter from '@kaetram/common/util/filter';
import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import type MongoDB from '../database/mongodb/mongodb';
import type Entities from './entities';
import type World from '../game/world';
import type Connection from '../network/connection';
import type {
    AbilityPacket,
    ContainerPacket,
    EquipmentPacket,
    LoginPacket,
    MovementPacket,
    ReadyPacket,
    StorePacket,
    WarpPacket,
    FriendsPacket
} from '@kaetram/common/types/messages/incoming';
import type Character from '../game/entity/character/character';
import type Player from '../game/entity/character/player/player';
import type Entity from '../game/entity/entity';
import type NPC from '../game/entity/npc/npc';
import type Chest from '../game/entity/objects/chest';

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
                    case Packets.Login: {
                        return this.handleLogin(message);
                    }
                    case Packets.Ready: {
                        return this.handleReady(message);
                    }
                    case Packets.List: {
                        return this.player.updateEntityList();
                    }
                    case Packets.Who: {
                        return this.handleWho(message);
                    }
                    case Packets.Equipment: {
                        return this.handleEquipment(message);
                    }
                    case Packets.Movement: {
                        return this.handleMovement(message);
                    }
                    case Packets.Target: {
                        return this.handleTarget(message);
                    }
                    case Packets.Network: {
                        return this.handleNetwork(message);
                    }
                    case Packets.Chat: {
                        return this.handleChat(message);
                    }
                    case Packets.Command: {
                        return this.handleCommand(message);
                    }
                    case Packets.Container: {
                        return this.handleContainer(message);
                    }
                    case Packets.Ability: {
                        return this.handleAbility(message);
                    }
                    case Packets.Respawn: {
                        return this.player.respawn();
                    }
                    case Packets.Trade: {
                        return this.handleTrade(message);
                    }
                    case Packets.Enchant: {
                        return this.handleEnchant(message);
                    }
                    case Packets.Warp: {
                        return this.handleWarp(message);
                    }
                    case Packets.Store: {
                        return this.handleStore(message);
                    }
                    case Packets.Friends: {
                        return this.handleFriends(message);
                    }
                    case Packets.Focus: {
                        return this.player.updateEntityPositions();
                    }
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

            // Synchronize the login immediately with the hub.
            this.world.api.sendLogin(this.player.username);

            // Proceed directly to login with default player data if skip database is present.
            if (config.skipDatabase) return this.player.load(Creator.serializePlayer(this.player));
        }

        // Handle login for each particular case.
        switch (opcode) {
            case Opcodes.Login.Login: {
                // Check the player in other servers first (defaults to false if hub is not present).
                return this.world.api.isPlayerOnline(this.player.username, (online: boolean) => {
                    if (online) return this.connection.reject('loggedin');

                    this.database.login(this.player);
                });
            }

            case Opcodes.Login.Register: {
                return this.database.register(this.player);
            }

            case Opcodes.Login.Guest: {
                this.player.isGuest = true; // Makes sure player doesn't get saved to database.
                this.player.username = `guest${Utils.counter}`; // Generate a random guest username.

                return this.player.load(Creator.serializePlayer(this.player));
            }
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
        this.world.linkFriends(this.player);

        if (this.player.isDead()) this.player.deathCallback?.();

        // A secondary check after the player has fully loaded in.
        this.world.api.isPlayerOnline(this.player.username, (online: boolean) => {
            if (online) this.player.connection.reject('loggedin');
        });
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
            case Opcodes.Equipment.Unequip: {
                return this.player.equipment.unequip(data.type);
            }
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
                targetInstance,
                orientation,
                following
            } = data,
            entity: Entity;

        if (this.player.dead) return;

        switch (opcode) {
            case Opcodes.Movement.Request: {
                return this.player.handleMovementRequest(
                    playerX!,
                    playerY!,
                    targetInstance!,
                    following!
                );
            }

            case Opcodes.Movement.Started: {
                return this.player.handleMovementStarted(
                    playerX!,
                    playerY!,
                    movementSpeed!,
                    targetInstance!
                );
            }

            case Opcodes.Movement.Step: {
                return this.player.handleMovementStep(playerX!, playerY!);
            }

            case Opcodes.Movement.Stop: {
                return this.player.handleMovementStop(
                    playerX!,
                    playerY!,
                    targetInstance!,
                    orientation
                );
            }

            case Opcodes.Movement.Entity: {
                entity = this.entities.get(targetInstance!) as Character;
                entity?.setPosition(requestX!, requestY!);
                break;
            }
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

            case Opcodes.Target.None: {
                // Nothing do to here.

                break;
            }

            case Opcodes.Target.Object: {
                return this.player.handleObjectInteraction(instance);
            }
        }
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
        if (text.startsWith('/') || text.startsWith(';')) return this.commands.parse(text);

        this.player.chat(Filter.clean(text));
    }

    private handleCommand(message: [Opcodes.Command, Coordinate]): void {
        let [opcode, position] = message;

        if (this.player.rank !== Modules.Ranks.Administrator) return;

        switch (opcode) {
            case Opcodes.Command.CtrlClick: {
                this.player.teleport(position.gridX, position.gridY, true);
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
        log.debug(`Received container packet: ${packet.opcode} - ${packet.type}`);

        switch (packet.opcode) {
            case Opcodes.Container.Select: {
                return this.player.handleContainerSelect(
                    packet.type,
                    packet.index!,
                    packet.subType
                );
            }

            case Opcodes.Container.Remove: {
                return this.player.handleContainerRemove(packet.type, packet.index!);
            }

            case Opcodes.Container.Swap: {
                return this.player.handleContainerSwap(packet.type, packet.index!, packet.tIndex!);
            }
        }
    }

    /**
     * Handles incoming abilities actions from the client. Things such as using
     * an ability or moving one to a quick slot.
     * @param packet Contains infomration about which ability to use and where to move it.
     */

    private handleAbility(packet: AbilityPacket): void {
        switch (packet.opcode) {
            case Opcodes.Ability.Use: {
                return this.player.abilities.use(packet.key);
            }

            case Opcodes.Ability.QuickSlot: {
                return this.player.abilities.setQuickSlot(packet.key, packet.index!);
            }
        }
    }

    private handleTrade(message: [Opcodes.Trade, string]): void {
        let [opcode] = message,
            oPlayer = this.entities.get(message[1]);

        if (!oPlayer) return;

        switch (opcode) {
            case Opcodes.Trade.Request: {
                break;
            }

            case Opcodes.Trade.Accept: {
                break;
            }

            case Opcodes.Trade.Decline: {
                break;
            }
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

        // Ignore invalid packets.
        if (data.index < 0) return;

        switch (data.opcode) {
            case Opcodes.Store.Buy: {
                return this.world.stores.purchase(this.player, data.key, data.index, data.count);
            }

            case Opcodes.Store.Sell: {
                return this.world.stores.sell(this.player, data.key, data.index, data.count);
            }

            case Opcodes.Store.Select: {
                return this.world.stores.select(this.player, data.key, data.index, data.count);
            }
        }
    }

    /**
     * Handles incoming packets from the client about the friends list. Contains
     * instructions such as adding or removing a friend from the list.
     * @param data Contains the opcode (type of action) and the username.
     */

    private handleFriends(data: FriendsPacket): void {
        switch (data.opcode) {
            case Opcodes.Friends.Add: {
                return this.player.friends.add(data.username);
            }

            case Opcodes.Friends.Remove: {
                return this.player.friends.remove(data.username);
            }
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
