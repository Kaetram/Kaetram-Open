import Commands from '../../../../controllers/commands';

import sanitizer from 'sanitizer';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import Filter from '@kaetram/common/util/filter';
import Creator from '@kaetram/common/database/mongodb/creator';
import { SpawnPacket } from '@kaetram/common/network/impl';
import { Opcodes, Packets } from '@kaetram/common/network';

import type Player from './player';
import type NPC from '../../npc/npc';
import type Entity from '../../entity';
import type World from '../../../world';
import type Character from '../character';
import type Chest from '../../objects/chest';
import type LootBag from '../../objects/lootbag';
import type Entities from '../../../../controllers/entities';
import type Connection from '../../../../network/connection';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';
import type {
    AbilityPacket,
    ContainerPacket,
    EquipmentPacket,
    LoginPacket,
    MovementPacket,
    ReadyPacket,
    StorePacket,
    WarpPacket,
    FriendsPacket,
    TradePacket,
    HandshakePacket,
    EnchantPacket,
    GuildPacket,
    CraftingPacket,
    PetPacket,
    LootBagPacket
} from '@kaetram/common/types/messages/incoming';
import type { QuestPacketData } from '@kaetram/common/network/impl/quest';

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

            player.connection.refreshTimeout();

            // Prevent server from crashing due to a packet malfunction.
            try {
                switch (packet) {
                    case Packets.Handshake: {
                        return this.handleHandshake(message);
                    }
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
                    case Packets.Quest: {
                        return this.handleQuest(message);
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
                    case Packets.Guild: {
                        return this.handleGuild(message);
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
                    case Packets.Examine: {
                        return this.handleExamine(message);
                    }
                    case Packets.Crafting: {
                        return this.handleCrafting(message);
                    }
                    case Packets.LootBag: {
                        return this.handleLootBag(message);
                    }
                    case Packets.Pet: {
                        return this.handlePet(message);
                    }
                }
            } catch (error) {
                log.error(error);
            }
        });
    }

    /**
     * The handshake is responsible for verifying the integrity of the client initially. We ensure
     * that the client is on the right version and reject it if it is not.
     * @param data Contains the version of the client.
     */

    private handleHandshake(data: HandshakePacket): void {
        if (data.gVer !== config.gver) this.connection.reject('updated');
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
            this.player.username = Filter.clean(username.toLowerCase().slice(0, 32).trim());

            // Verify that the password fulfills the requirements.
            if (!Utils.isValidPassword(password)) return this.connection.reject('invalidpassword');

            if (password) this.player.password = password.slice(0, 64);
            if (email) this.player.email = email;

            // Reject connection if player is already logged in.
            if (this.world.isOnline(this.player.username))
                return this.connection.reject('loggedin');

            // Proceed directly to login with default player data if skip database is present.
            if (config.skipDatabase) {
                this.player.load(Creator.serialize(this.player));
                return;
            }
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
                if (config.disableRegister) return this.connection.reject('disabledregister');

                return this.database.register(this.player);
            }

            case Opcodes.Login.Guest: {
                // Authenticated so that we send the logout packet to the hub.
                this.player.authenticated = true;
                this.player.isGuest = true; // Makes sure player doesn't get saved to database.
                this.player.username = `guest${Utils.counter++}`; // Generate a random guest username.

                this.player.load(Creator.serialize(this.player));
                return;
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

        this.world.syncFriendsList(this.player.username);
        this.world.syncGuildMembers(this.player.guild, this.player.username);

        this.world.discord.sendMessage(this.player.username, 'has logged in!');

        // Synchronize friends list cross-server by sending inactive friends to hub.
        this.player.friends.sync();

        if (this.player.isDead()) this.player.deathCallback?.();

        this.player.welcome();

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
        for (let instance of message) {
            let entity = this.entities.get(instance);

            if (!entity || entity.dead) continue;

            /* We handle player-specific entity statuses here. */
            this.player.send(
                new SpawnPacket(
                    entity,
                    entity.hasDisplayInfo(this.player) ? this.player : undefined
                )
            );
        }
    }

    /**
     * Handles equipment packet. Generally involved in unequipping.
     * @param data Contains information about which slot to unequip.
     */

    private handleEquipment(data: EquipmentPacket): void {
        switch (data.opcode) {
            case Opcodes.Equipment.Unequip: {
                return this.player.equipment.unequip(data.type!);
            }

            case Opcodes.Equipment.Style: {
                return this.player.equipment.updateAttackStyle(data.style!);
            }
        }
    }

    /**
     * Handles movement packets for the player. We use these to verify the player's
     * position and implement a couple anti-cheating measures.
     * @param data Contains the type of movement we are performing and information about it.
     */

    private handleMovement(data: MovementPacket): void {
        let {
                opcode,
                requestX,
                requestY,
                playerX,
                playerY,
                nextGridX,
                nextGridY,
                movementSpeed,
                targetInstance,
                orientation,
                timestamp
            } = data,
            entity: Entity;

        if (this.player.isDead()) return;

        // Sanitize position information to prevent cheating.
        if (requestX) requestX = Utils.sanitizeNumber(requestX);
        if (requestY) requestY = Utils.sanitizeNumber(requestY);
        if (playerX) playerX = Utils.sanitizeNumber(playerX);
        if (playerY) playerY = Utils.sanitizeNumber(playerY);
        if (nextGridX) nextGridX = Utils.sanitizeNumber(nextGridX);
        if (nextGridY) nextGridY = Utils.sanitizeNumber(nextGridY);

        // Prevent any crazy packet tampering.
        if (this.world.map.isOutOfBounds(requestX!, requestY!)) return;
        if (this.world.map.isOutOfBounds(playerX!, playerY!)) return;

        switch (opcode) {
            case Opcodes.Movement.Request: {
                return this.player.handleMovementRequest(playerX!, playerY!, targetInstance!);
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
                return this.player.handleMovementStep(
                    playerX!,
                    playerY!,
                    nextGridX!,
                    nextGridY!,
                    timestamp
                );
            }

            case Opcodes.Movement.Stop: {
                return this.player.handleMovementStop(
                    playerX!,
                    playerY!,
                    targetInstance!,
                    orientation!
                );
            }

            case Opcodes.Movement.Entity: {
                entity = this.entities.get(targetInstance!) as Character;

                if (!entity) return;

                // Pet movement is only handled by the owner.
                if (entity.isPet() && entity.owner?.instance === this.player.instance)
                    return entity.setPosition(requestX!, requestY!);

                // Skip players or invalid entities.
                if (!entity?.isMob() || entity.isStunned() || entity.isDead()) return;

                // Do not update if it's the same value.
                if (entity.x === requestX && entity.y === requestY) return;

                // Prevent crazy position updates, add some leeway to the roaming distance.
                if (entity.outsideRoaming(requestX!, requestY!, entity.roamDistance * 2)) return;

                // For mobs update the position without a packet.
                return entity.setPosition(requestX!, requestY!, false);
            }
        }
    }

    private handleTarget(message: [Opcodes.Target, string, number?, number?]): void {
        let [opcode, instance, x, y] = message;

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
                return this.player.handleTargetAttack(instance, x, y);
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

        // Check for mute before filtering the message.
        if (this.player.isMuted()) return this.player.notify('misc:MUTED', 'crimson');

        this.player.chat(Filter.clean(text));
    }

    /**
     * Commands received from the server. Used by administrators to perform
     * debugging or administrative tasks.
     * @param message Contains the opcode and position information.
     */

    private handleCommand(message: [Opcodes.Command, Coordinate]): void {
        let [opcode, position] = message;

        if (!this.player.isAdmin() && !this.player.isHollowAdmin()) return;

        switch (opcode) {
            case Opcodes.Command.CtrlClick: {
                return this.player.teleport(position.gridX, position.gridY, true, false, true);
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
        //log.debug(`Received container packet: ${packet.opcode} - ${packet.type}`);

        // Sanitize the incoming packet information.
        if (packet.value) packet.value = Utils.sanitizeNumber(packet.value);
        if (packet.fromIndex) packet.fromIndex = Utils.sanitizeNumber(packet.fromIndex);

        switch (packet.opcode) {
            case Opcodes.Container.Select: {
                // Ensure the packet has a valid index.
                if (isNaN(packet.fromIndex!) || packet.fromIndex === -1) return;

                return this.player.handleContainerSelect(
                    packet.type,
                    packet.fromContainer,
                    packet.fromIndex!,
                    packet.toContainer!,
                    packet.value
                );
            }

            case Opcodes.Container.Remove: {
                return this.player.handleContainerRemove(
                    packet.type,
                    packet.fromIndex!,
                    packet.value!
                );
            }

            case Opcodes.Container.Swap: {
                return this.player.handleContainerSwap(
                    packet.type,
                    packet.fromIndex!,
                    packet.value!
                );
            }
        }
    }

    /**
     * Used for progressing the quest when the player accepts the start quest interface.
     * @param packet Contains the key of the quest we are progressing.
     */

    private handleQuest(packet: QuestPacketData): void {
        let quest = this.player.quests.get(packet.key!);

        if (!quest) return log.warning(`Quest ${packet.key} does not exist.`);

        quest.handlePrompt();
    }

    /**
     * Handles incoming abilities actions from the client. Things such as using
     * an ability or moving one to a quick slot.
     * @param packet Contains infomration about which ability to use and where to move it.
     */

    private handleAbility(packet: AbilityPacket): void {
        // Sanitize the incoming index information.
        if (packet.index) packet.index = Utils.sanitizeNumber(packet.index);

        switch (packet.opcode) {
            case Opcodes.Ability.Use: {
                return this.player.abilities.use(packet.key);
            }

            case Opcodes.Ability.QuickSlot: {
                return this.player.abilities.setQuickSlot(packet.key, packet.index!);
            }
        }
    }

    private handleTrade(packet: TradePacket): void {
        switch (packet.opcode) {
            case Opcodes.Trade.Request: {
                let oPlayer = this.entities.get(packet.instance);

                if (!oPlayer?.isPlayer()) return;

                return this.player.trade.request(oPlayer);
            }

            case Opcodes.Trade.Accept: {
                return this.player.trade.accept();
            }

            case Opcodes.Trade.Close: {
                return this.player.trade.close();
            }

            case Opcodes.Trade.Add: {
                return this.player.trade.add(
                    packet.index,
                    Utils.sanitizeNumber(packet.count, true)
                );
            }

            case Opcodes.Trade.Remove: {
                return this.player.trade.remove(packet.index);
            }
        }
    }

    /**
     * Handles an incoming packet from the client regarding the enchantment table. Things like
     * selecting the item or confirming the selection are sent to the enchantment controller.
     * @param packet Contains the opcode and index of the item(s) selected.
     */

    private handleEnchant(packet: EnchantPacket): void {
        if (!this.player.canAccessContainer) return this.player.notify('misc:CANNOT_DO_THAT');

        // Sanitize the index and the shard index.
        if (packet.index) packet.index = Utils.sanitizeNumber(packet.index);
        if (packet.shardIndex) packet.shardIndex = Utils.sanitizeNumber(packet.shardIndex);

        switch (packet.opcode) {
            case Opcodes.Enchant.Select: {
                return this.world.enchanter.select(this.player, packet.index!);
            }

            case Opcodes.Enchant.Confirm: {
                return this.world.enchanter.enchant(this.player, packet.index!, packet.shardIndex!);
            }
        }
    }

    /**
     * Receives a packet regarding a guild action from the client. We respond accordingly.
     * @param packet Contains the opcode and information about the request.
     */

    private handleGuild(packet: GuildPacket): void {
        switch (packet.opcode) {
            case Opcodes.Guild.Create: {
                this.world.guilds.create(
                    this.player,
                    packet.name!,
                    packet.colour!,
                    packet.outline!,
                    packet.outlineColour!,
                    packet.crest!
                );

                break;
            }

            case Opcodes.Guild.Join: {
                this.world.guilds.join(this.player, packet.identifier!);

                break;
            }

            case Opcodes.Guild.Leave: {
                this.world.guilds.leave(this.player);

                break;
            }

            case Opcodes.Guild.List: {
                this.world.guilds.get(this.player, packet.from!, packet.to!);

                break;
            }

            case Opcodes.Guild.Chat: {
                this.world.guilds.chat(this.player, packet.message!);

                break;
            }

            case Opcodes.Guild.Promote: {
                this.world.guilds.promote(this.player, packet.username!);

                break;
            }

            case Opcodes.Guild.Demote: {
                this.world.guilds.demote(this.player, packet.username!);

                break;
            }

            case Opcodes.Guild.Kick: {
                this.world.guilds.kick(this.player, packet.username!);

                break;
            }
        }
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
        // log.debug(`Received store packet: ${data.opcode}`);

        // Ignore invalid packets.
        if (data.index < 0) return;

        // Sanitize the packet information to prevent any funny business.
        data.count = Utils.sanitizeNumber(data.count, true);
        data.index = Utils.sanitizeNumber(data.index, true);

        // Make sure the count is at least 1.
        if (data.count < 1) data.count = 1;

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
     * Handles the interaction with the examine button. Just displays
     * the description for the entity selected (generally a mob).
     * @param instance The instance of the entity.
     */

    private handleExamine(instance: string): void {
        let entity = this.entities.get(instance);

        if (!entity) return;

        if (!entity.isMob() && !entity.isItem()) return;

        this.player.statistics.addMobExamine(entity.key);

        if (!entity.description) return this.player.notify('misc:NO_IDEA');

        this.player.notify(entity.getDescription());
    }

    /**
     * Handles incoming actions from the client regarding the crafting interface.
     * @param data Contains information about the kind of action.
     */

    private handleCrafting(data: CraftingPacket): void {
        // Ensure the player is not maliciously trying to craft something.
        if (this.player.activeCraftingInterface === -1)
            return this.player.notify('misc:CANNOT_DO_THAT');

        // Sanitize the packet information to prevent any funny business.
        if (data.count) data.count = Utils.sanitizeNumber(data.count, true);

        switch (data.opcode) {
            case Opcodes.Crafting.Select: {
                return this.world.crafting.select(this.player, data.key!);
            }

            case Opcodes.Crafting.Craft: {
                return this.world.crafting.craft(this.player, data.key!, data.count!);
            }
        }
    }

    /**
     * Handles an incoming loot bag packet. This is generally for when a player
     * attempts to take an item from the loot bag or when they close the interface.
     * @param data Contains the opcode and optionally, the index of the item.
     */

    private handleLootBag(data: LootBagPacket): void {
        switch (data.opcode) {
            case Opcodes.LootBag.Take: {
                let lootBag = this.world.entities.get(this.player.activeLootBag!) as LootBag;

                if (!lootBag) return;

                return lootBag.take(this.player, data.index!);
            }
        }
    }

    /**
     * Handles the pet packet actions received from the client. This can include picking up the
     * pet. Further actions will be added in the future as needed.
     * @param data Contains the opcode for the action.
     */

    private handlePet(data: PetPacket): void {
        switch (data.opcode) {
            case Opcodes.Pet.Pickup: {
                if (this.player.pickingUpPet || !this.player.hasPet()) return;

                this.player.pickingUpPet = true;
                this.player.pickingUpPet = !this.player.removePet();

                return;
            }
        }
    }
}
