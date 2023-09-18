import Util from '../utils/util';

import { inflate } from 'pako';
import { Packets, Opcodes, Modules } from '@kaetram/common/network';

import type App from '../app';
import type Game from '../game';
import type Map from '../map/map';
import type Socket from './socket';
import type Messages from './messages';
import type NPC from '../entity/npc/npc';
import type Camera from '../renderer/camera';
import type Item from '../entity/objects/item';
import type Overlays from '../renderer/overlays';
import type Renderer from '../renderer/renderer';
import type MenuController from '../controllers/menu';
import type InfoController from '../controllers/info';
import type InputController from '../controllers/input';
import type AudioController from '../controllers/audio';
import type BubbleController from '../controllers/bubble';
import type Character from '../entity/character/character';
import type SpritesController from '../controllers/sprites';
import type Player from '../entity/character/player/player';
import type PointerController from '../controllers/pointer';
import type EntitiesController from '../controllers/entities';
import type { PlayerData } from '@kaetram/common/network/impl/player';
import type { EntityDisplayInfo } from '@kaetram/common/types/entity';
import type { SerializedSkills, SkillData } from '@kaetram/common/network/impl/skill';
import type { SerializedAbility, AbilityData } from '@kaetram/common/network/impl/ability';
import type {
    AbilityPacketData,
    AchievementPacketData,
    AnimationPacketData,
    BubblePacketData,
    ChatPacketData,
    CombatPacketData,
    CommandPacketData,
    ContainerPacketData,
    DespawnPacketData,
    EnchantPacketData,
    EquipmentPacketData,
    ExperiencePacketData,
    HealPacketData,
    MovementPacketData,
    NotificationPacketData,
    NPCPacketData,
    OverlayPacketData,
    PointerPacketData,
    PointsPacketData,
    PVPPacketData,
    QuestPacketData,
    RespawnPacketData,
    StorePacketData,
    TeleportPacketData,
    SkillPacketData,
    MinigamePacketData,
    EffectPacketData,
    FriendsPacketData,
    EntityListPacketData,
    TradePacketData,
    HandshakePacketData,
    GuildPacketData,
    CraftingPacketData,
    LootBagPacketData,
    CountdownPacketData,
    InterfacePacketData
} from '@kaetram/common/types/messages/outgoing';
import type { TradePacketValues } from '@kaetram/common/network/impl/trade';
import type { EquipmentPacketValues } from '@kaetram/common/network/impl/equipment';
import type Resource from '../entity/objects/resource/resource';
import type { ResourcePacketData } from '@kaetram/common/network/impl/resource';

export default class Connection {
    /**
     * Keep all game objects as instances in this class
     * in order to cut down on length of code when trying
     * to access them.
     */

    private app: App;
    private overlays: Overlays;
    private info: InfoController;
    private map: Map;
    private camera: Camera;
    private renderer: Renderer;
    private input: InputController;
    private socket: Socket;
    private pointer: PointerController;
    private audio: AudioController;
    private entities: EntitiesController;
    private bubble: BubbleController;
    private menu: MenuController;
    private sprites: SpritesController;
    private messages: Messages;

    private lastEntityListRequest = Date.now();

    /**
     * Connection controller keeps track of all the incoming packets
     * and reroutes them to their specific function for organization purposes.
     */

    public constructor(private game: Game) {
        this.app = game.app;
        this.overlays = game.overlays;
        this.info = game.info;
        this.map = game.map;
        this.camera = game.camera;
        this.renderer = game.renderer;
        this.input = game.input;
        this.socket = game.socket;
        this.pointer = game.pointer;
        this.audio = game.audio;
        this.entities = game.entities;
        this.bubble = game.bubble;
        this.menu = game.menu;
        this.sprites = game.sprites;
        this.messages = this.socket.messages;

        this.app.onFocus(() => this.socket.send(Packets.Focus));

        this.messages.onHandshake(this.handleHandshake.bind(this));
        this.messages.onWelcome(this.handleWelcome.bind(this));
        this.messages.onMap(this.handleMap.bind(this));
        this.messages.onEquipment(this.handleEquipment.bind(this));
        this.messages.onSpawn(this.entities.create.bind(this.entities));
        this.messages.onEntityList(this.handleEntityList.bind(this));
        this.messages.onSync(this.handleSync.bind(this));
        this.messages.onMovement(this.handleMovement.bind(this));
        this.messages.onTeleport(this.handleTeleport.bind(this));
        this.messages.onDespawn(this.handleDespawn.bind(this));
        this.messages.onCombat(this.handleCombat.bind(this));
        this.messages.onAnimation(this.handleAnimation.bind(this));
        this.messages.onPoints(this.handlePoints.bind(this));
        this.messages.onNetwork(this.handleNetwork.bind(this));
        this.messages.onChat(this.handleChat.bind(this));
        this.messages.onCommand(this.handleCommand.bind(this));
        this.messages.onContainer(this.handleContainer.bind(this));
        this.messages.onAbility(this.handleAbility.bind(this));
        this.messages.onQuest(this.handleQuest.bind(this));
        this.messages.onAchievement(this.handleAchievement.bind(this));
        this.messages.onNotification(this.handleNotification.bind(this));
        this.messages.onBlink(this.handleBlink.bind(this));
        this.messages.onHeal(this.handleHeal.bind(this));
        this.messages.onExperience(this.handleExperience.bind(this));
        this.messages.onDeath(this.handleDeath.bind(this));
        this.messages.onMusic(this.handleMusic.bind(this));
        this.messages.onNPC(this.handleNPC.bind(this));
        this.messages.onRespawn(this.handleRespawn.bind(this));
        this.messages.onTrade(this.handleTrade.bind(this));
        this.messages.onEnchant(this.handleEnchant.bind(this));
        this.messages.onGuild(this.handleGuild.bind(this));
        this.messages.onPointer(this.handlePointer.bind(this));
        this.messages.onPVP(this.handlePVP.bind(this));
        this.messages.onPoison(this.handlePoison.bind(this));
        this.messages.onStore(this.handleStore.bind(this));
        this.messages.onOverlay(this.handleOverlay.bind(this));
        this.messages.onCamera(this.handleCamera.bind(this));
        this.messages.onBubble(this.handleBubble.bind(this));
        this.messages.onSkill(this.handleSkill.bind(this));
        this.messages.onUpdate(this.handleUpdate.bind(this));
        this.messages.onMinigame(this.handleMinigame.bind(this));
        this.messages.onEffect(this.handleEffect.bind(this));
        this.messages.onFriends(this.handleFriends.bind(this));
        this.messages.onRank(this.handleRank.bind(this));
        this.messages.onCrafting(this.handleCrafting.bind(this));
        this.messages.onInterface(this.handleInterface.bind(this));
        this.messages.onLootBag(this.handleLootBag.bind(this));
        this.messages.onCountdown(this.handleCountdown.bind(this));
        this.messages.onResource(this.handleResource.bind(this));
    }

    /**
     * Handles the handshake packet from the server. The handshake signals
     * to the client that the connection is now established and the client
     * must send the login packet (guest, registering, or login).
     */

    private handleHandshake(data: HandshakePacketData): void {
        if (data.type !== 'client') {
            this.app.updateLoader('Invalid client');

            return;
        }

        this.app.updateLoader('Connecting to server');

        // Set the server id and instance
        this.game.player.instance = data.instance!;
        this.game.player.serverId = data.serverId!;

        // Guest login doesn't require any credentials, send the packet right away.
        if (this.app.isGuest())
            return this.socket.send(Packets.Login, { opcode: Opcodes.Login.Guest });

        let username = this.app.getUsername(),
            password = this.app.getPassword(),
            email = this.app.getEmail();

        // Assign username to palyer object (will get overriden after login is completed).
        this.game.player.name = username.toLowerCase();

        // Send register packet if the user is registering.
        if (this.app.isRegistering())
            return this.socket.send(Packets.Login, {
                opcode: Opcodes.Login.Register,
                username,
                password,
                email
            });

        // Send login packet if the user is logging in.
        this.socket.send(Packets.Login, {
            opcode: Opcodes.Login.Login,
            username,
            password
        });
    }

    /**
     * Receives the serialized player data from the server
     * and begins loading the game instance of the player.
     * @param data Serialized player data object.
     */

    private handleWelcome(data: PlayerData): void {
        this.game.player.load(data);

        this.game.start();
        this.game.postLoad();
    }

    /**
     * Receives the compressed map data from the server. Due to the size of
     * the map data, we must compress when sending and decompress on the client's
     * end. We ensure that this map region is saved in the client to prevent
     * relying on the client always pulling map data.
     * @param info Compressed region data of the map.
     */

    private handleMap(info: string): void {
        let bufferData = window
                .atob(info)
                // eslint-disable-next-line unicorn/prefer-spread
                .split('')
                // eslint-disable-next-line unicorn/prefer-code-point
                .map((char) => char.charCodeAt(0)),
            inflatedString = inflate(new Uint8Array(bufferData), { to: 'string' }),
            regions = JSON.parse(inflatedString);

        this.map.loadRegions(regions);

        // Used if the client uses low-power mode, forces redrawing of trees.
        this.renderer.forceRendering = true;

        if (!this.map.hasCachedDate()) this.app.fadeMenu();
    }

    /**
     * Receives the equipment packet from the server. When we receive batch
     * data from the server we update every equipment slot with the new data.
     * A single equipment is accompanied by a type and serialized slot info.
     * @param opcode Type of equipment packet we are working with.
     * @param info Data containing equipment(s) information.
     */

    private handleEquipment(opcode: Opcodes.Equipment, info: EquipmentPacketValues): void {
        switch (opcode) {
            case Opcodes.Equipment.Batch: {
                let { data } = info as EquipmentPacketData[typeof opcode];

                for (let equipment of data.equipments) this.game.player.equip(equipment);

                break;
            }

            case Opcodes.Equipment.Equip: {
                let { data } = info as EquipmentPacketData[typeof opcode];

                this.game.player.equip(data);
                break;
            }

            case Opcodes.Equipment.Unequip: {
                let { type, count } = info as EquipmentPacketData[typeof opcode];

                this.game.player.unequip(type, count);
                break;
            }

            case Opcodes.Equipment.Style: {
                let { attackRange, attackStyle } = info as EquipmentPacketData[typeof opcode];

                this.game.player.setAttackStyle(attackStyle);
                this.game.player.attackRange = attackRange;

                break;
            }
        }

        this.game.player.sync();

        // Update the lighting for the player.
        this.renderer.updatePlayerLight();
    }

    /**
     * Compares the list of entities from the server and removes any enities that are spawned
     * but no longer contained within the region. This occurs when the player goes from one
     * region to another, and we are queueing up entities for depsawn.
     * @param entities A list of strings that contains the instances of the entities in the region.
     */

    private handleEntityList(opcode: Opcodes.List, info: EntityListPacketData): void {
        switch (opcode) {
            case Opcodes.List.Spawns: {
                let ids = new Set(
                        Object.values(this.entities.getAll()).map((entity) => entity.instance)
                    ),
                    known = new Set(info.entities!.filter((id) => ids.has(id))),
                    newIds = info.entities!.filter((id) => !known.has(id));

                // Prepare the entities ready for despawning.
                this.entities.decrepit = Object.values(this.entities.getAll()).filter(
                    (entity) =>
                        !known.has(entity.instance) && entity.instance !== this.game.player.instance
                );

                // Clear the entities in the decrepit queue.
                this.entities.clean();

                // Send the new id list request to the server.
                this.socket.send(Packets.Who, newIds);
                break;
            }

            case Opcodes.List.Positions: {
                // Look through all the positions of the entities and their instances.
                for (let instance in info.positions!) {
                    let position = info.positions[instance],
                        entity = this.entities.get<Character>(instance);

                    // No entity found, just skip.
                    if (!entity) return;

                    /**
                     * When we detect a mismatch in client-sided and server-sided
                     * entity positions we teleport the entity to the correct position.
                     */

                    if (entity.gridX !== position.x || entity.gridY !== position.y)
                        this.game.teleport(entity, position.x, position.y);
                }
            }
        }
    }

    /**
     * Handles the synchronization packet from the server. Synchronization
     * is used when the player entity undergoes a change and that is
     * relayed to the nearby players (level change, equipment change, etc.).
     * @param data Player data object containing new information about the player entity.
     */

    private handleSync(data: PlayerData): void {
        let player = this.entities.get<Player>(data.instance);

        // Invalid instance, player not found/not spawned.
        if (!player || player.teleporting || player.dead || !player.ready) return;

        player.load(data, true);

        player.setSprite(this.game.sprites.get(player.getSpriteName()));

        this.renderer.updatePlayerLight(player);
    }

    /**
     * Handles the movement packets. These can either be request to move to a position,
     * a follow request, or a forcibly (optional) stop request. Freeze and stunned states
     * also get sent alongside the movement packets.
     * @param opcode The type of movement we are dealing with.
     * @param info Information such as instance and coordinates of the entity that is moving.
     */

    private handleMovement(opcode: Opcodes.Movement, info: MovementPacketData): void {
        let entity = this.entities.get<Character>(info.instance) as Character,
            target: Character;

        /**
         * We are receiving movement for an entity that doesn't exist,
         * we need to request an entity list update to the server.
         */
        if (!entity) {
            // Ensures packets are not spammed to the server.
            if (!this.canRequestEntityList()) return;

            // Update the last entity list request time.
            this.lastEntityListRequest = Date.now();

            // Request an entity list update from the server.
            return this.socket.send(Packets.List);
        }

        switch (opcode) {
            case Opcodes.Movement.Move: {
                entity.go(
                    info.x!,
                    info.y!,
                    info.forced,
                    info.instance !== this.game.player.instance
                );
                break;
            }

            case Opcodes.Movement.Follow: {
                target = this.entities.get<Character>(info.target!);

                if (target) {
                    // Prevent following a target after we've clicked off of it.
                    if (
                        entity.instance === this.game.player.instance &&
                        !this.game.player.hasTarget() &&
                        !info.forced
                    )
                        return;

                    entity.follow(target);

                    if (entity.isPet()) target.addFollower(entity);
                }

                break;
            }

            case Opcodes.Movement.Stop: {
                return entity.stop();
            }

            case Opcodes.Movement.Speed: {
                entity.movementSpeed = info.movementSpeed!;
                break;
            }
        }
    }

    /**
     * Handler for the teleportation packet. Used when a player entity
     * teleports to a new location.
     * @param info Instance of the entity, x and y coordinates, and whether to animate.
     */

    private handleTeleport(info: TeleportPacketData): void {
        let entity = this.entities.get<Character>(info.instance);

        if (!entity?.isMob() && !entity?.isPlayer()) return;

        this.input.selectedCellVisible = false;

        // If the entity is the same as our main entity.
        let currentPlayer = entity.instance === this.game.player.instance;

        // Stop and freeze the player until teleprtation is complete.
        entity.stop();
        entity.frozen = true;

        // Clears all bubbles when our main entity teleports.
        if (currentPlayer) {
            this.bubble.clean();

            // Disable keyboard actions until teleportation is complete.
            this.game.player.disableAction = true;
        } else this.bubble.clear(entity.instance); // Clears bubble of teleporting entity.

        // No animation, skip straight to teleporting.
        if (!info.withAnimation) return this.game.teleport(entity, info.x, info.y);

        // Copy the entity's sprite temporarily.
        let entitySprite = entity.sprite.key;

        // Set the entity's sprite to the death animation sprite.
        entity.setSprite(this.sprites.getDeath());

        // Prevent rendering of the sword.
        entity.teleporting = true;

        entity.animateDeath(() => {
            this.game.teleport(entity, info.x, info.y);

            // Reset the animation.
            entity.animation = null;

            // Restore the entity's sprite.
            entity.setSprite(this.sprites.get(entitySprite));
            entity.idle(entity.orientation, true);
        }, 160);
    }

    /**
     * Handler for when we want to despawn an entity.
     * @param info Contains despawn packet information such as instance and list of regions to ignore.
     */

    private handleDespawn(info: DespawnPacketData): void {
        let entity = this.entities.get<Character>(info.instance);

        // Could not find the entity.
        if (!entity) return;

        // If a list of regions is provided, we check the entity is in one of those regions.
        if (info.regions && !info.regions.includes(entity.region)) return;

        // Handle item despawn separately here.
        if (entity.isItem()) return this.entities.removeItem(entity);

        // Handle chest and animations here.
        if (entity.isChest()) return this.entities.removeChest(entity);

        // Handle npc despawn here.
        if (entity.isNPC()) return this.entities.removeNPC(entity);

        // Despawn the entity.
        entity.despawn();

        // Removes bubbles from the entity.
        this.bubble.clear(entity.instance);

        // Clears our client's target.
        if (this.game.player.hasTarget(entity)) this.game.player.removeTarget();

        // Plays a random kill sound.
        this.audio.playKillSound(entity);

        // Certain entities will have a special death animation, otherwise we use default.
        if (!entity.sprite.hasDeathAnimation) entity.setSprite(this.sprites.getDeath());

        // Animate the entity's death.
        entity.animateDeath(() => this.entities.removeEntity(entity));
    }

    /**
     * Combat packet handler. Primarily deals with displaying hit damages
     * and creating infos on the screen.
     * @param opcode Type of combat packet we're dealing with.
     * @param info Contains attacker, target, and damage information.
     */

    private handleCombat(opcode: Opcodes.Combat, info: CombatPacketData): void {
        let attacker = this.entities.get<Character>(info.instance),
            target = this.entities.get<Character>(info.target);

        // Could not find the attacker or target.
        if (!attacker || !target) return;

        if (opcode !== Opcodes.Combat.Hit) return;

        // Check if our client's player is the target or the attacker.
        let currentPlayerTarget = target.instance === this.game.player.instance,
            currentPlayerAttacker = attacker.instance === this.game.player.instance,
            isPoison = info.hit.type === Modules.Hits.Poison,
            isFreezing = info.hit.type === Modules.Hits.Freezing,
            isBurning = info.hit.type === Modules.Hits.Burning;

        // Set the terror effect onto the target.
        if (isPoison) target.addEffect(Modules.Effects.Poisonball);

        // Perform the critical effect onto the target.
        if (info.hit.type === Modules.Hits.Critical) target.addEffect(Modules.Effects.Critical);

        // Perform the attack animation if the damage type isn't from AOE or poison.
        if (!info.hit.aoe && !isPoison && !isFreezing && !isBurning) {
            attacker.lookAt(target);
            attacker.performAction(attacker.orientation, Modules.Actions.Attack);
        }

        // If the game client player is the attacker, we play the hit sound effect.
        if (currentPlayerAttacker && info.hit.damage > 0) this.audio.playHitSound(target);

        // Play the hurt sound effect if the client player is the target.
        if (currentPlayerTarget && info.hit.damage > 0) this.audio.playSound('hurt');

        // Create the hit info to be displayed above the entity.
        this.info.create(info.hit.type, info.hit.damage, target.x, target.y, currentPlayerTarget);

        // Flash the target character when a hit occurs.
        if (info.hit.damage > 0) target.toggleHurt();

        // Show the health bar for both entities.
        attacker.triggerHealthBar();
        target.triggerHealthBar();

        // Add the attacker to the target's list of attackers.
        target.addAttacker(attacker);

        // Ensure the attacker and the target are not on the same tile and just move them.
        if (attacker.isMob() && attacker.gridX === target.gridX && attacker.gridY === target.gridY)
            this.game.findAdjacentTile(attacker);
    }

    /**
     * Animates a character based on the provided instance.
     * @param info Contains instance and what animation to perform.
     */

    private handleAnimation(info: AnimationPacketData): void {
        let character = this.entities.get<Character>(info.instance);

        character?.performAction(character.orientation, info.action);

        if (info.resourceInstance) {
            let resource = this.entities.get<Resource>(info.resourceInstance);

            resource?.shake();
        }
    }

    /**
     * Handles the points packet. Used when a player is being hit
     * or heals their hit points or mana.
     * @param info Contains the player instance, hit points, and mana.
     */

    private handlePoints(info: PointsPacketData): void {
        let character = this.entities.get<Player>(info.instance);

        if (!character || character.dead) return;

        if (info.mana) character.setMana(info.mana, info.maxMana);

        if (info.hitPoints) {
            character.setHitPoints(info.hitPoints, info.maxHitPoints);
            this.input.hud.updateCallback?.(info.instance, info.hitPoints);
        }
    }

    /**
     * Handler for the network packet. These are debugging methods such
     * as latency tests that may be implemented in the future.
     */

    private handleNetwork(): void {
        // Send a resposne to the ping back.
        this.socket.send(Packets.Network, [Opcodes.Network.Pong]);
    }

    /**
     * Chat packets can either be static or instance based. Those that are static
     * are generally used for global messaging system, whereas the instance-based
     * ones are for nearby players where we want to display a bubble.
     * @param info Info contains source, message, colour, and whether
     * or not to display a bubble. Instance is optional but may be contained
     * when a player sends a chat.
     */

    private handleChat(info: ChatPacketData): void {
        // Parse the message for special characters.
        info.message = Util.parseMessage(info.message);

        // Messages with source are static, we add them directly to the chatbox.
        if (info.source)
            return this.input.chatHandler.add(info.source, info.message, info.colour, true);

        let entity = this.entities.get<Player>(info.instance!);

        if (!entity) return;

        let { name, rank, x, y } = entity;

        if (rank !== Modules.Ranks.None) name = `[${Modules.RankTitles[rank]}] ${name}`;

        // Add to the chatbox, if global, we prefix it to the entity's name.
        this.input.chatHandler.add(name, info.message, info.colour);

        // Draw bubble and play audio.
        if (info.withBubble) {
            this.bubble.create(info.instance!, info.message);
            this.bubble.setTo(info.instance!, x, y);

            this.audio.playSound('npctalk', entity);
        }
    }

    /**
     * Hardcoded administrative commands built into the client. When a player
     * types a special command, the server checks against the player's rank
     * before sending this packet. These are merely debugging/graphical tests.
     * @param info Packet contains the command string.
     */

    private handleCommand(info: CommandPacketData): void {
        if (info.command.includes('toggle') && this.game.player.hasActiveEffect())
            return this.game.player.removeAllEffects();

        switch (info.command) {
            case 'debug': {
                this.renderer.debugging = !this.renderer.debugging;
                return;
            }

            case 'hide': {
                return this.game.player.setVisible(!this.game.player.isVisible());
            }
        }
    }

    /**
     * Receives container information (bank or inventory for now) and updates it.
     * @param opcode What type of container action we are working with.
     * @param info Contains array of serialized slots, a single slot, and type of container.
     */

    private handleContainer(opcode: Opcodes.Container, info: ContainerPacketData): void {
        let container =
            info.type === Modules.ContainerType.Inventory
                ? this.menu.getInventory()
                : this.menu.getBank();

        switch (opcode) {
            case Opcodes.Container.Batch: {
                container.batch(info.data!.slots);
                break;
            }

            case Opcodes.Container.Add: {
                container.add(info.slot!);
                break;
            }

            case Opcodes.Container.Remove: {
                container.remove(info.slot!);
                break;
            }
        }

        // Synchronizes all the open menus that have containers.
        this.menu.synchronize();
    }

    /**
     * Handler for when we receive an ability packet. Ability packets contain
     * batch data or a single ability undergoing a change (generally level).
     * @param opcode The type of ability packet we are working with.
     * @param info Contains information in batch about abilities or a single ability serialized information.
     */

    private handleAbility(opcode: Opcodes.Ability, info: AbilityPacketData): void {
        switch (opcode) {
            case Opcodes.Ability.Batch: {
                this.game.player.loadAbilities((info as SerializedAbility).abilities);
                break;
            }

            // Update the ability data whenever we receive any information.
            case Opcodes.Ability.Add:
            case Opcodes.Ability.Update: {
                info = info as AbilityData;
                this.game.player.setAbility(info.key, info.level, info.type, info.quickSlot);
                break;
            }

            case Opcodes.Ability.Toggle: {
                this.game.player.toggleAbility((info as AbilityData).key);
                break;
            }
        }

        this.menu.synchronize('profile');
    }

    /**
     * Quest packets are sent when the player logs in and performs
     * the initial loading in a batch. This contains every quest along with the
     * key, name, description, and stage. This packet may also receive individual
     * quest information that updates the stage. Since the quests are already loaded
     * the individual quest data only contains key, stage, and max stage.
     * @param opcode What type of quest action we are working with.
     * @param info Contains quest batch data or individual quest data.
     */

    private handleQuest(opcode: Opcodes.Quest, info: QuestPacketData): void {
        switch (opcode) {
            case Opcodes.Quest.Batch: {
                this.game.player.loadQuests(info.quests!);
                break;
            }

            case Opcodes.Quest.Progress: {
                this.game.player.setQuest(info.key!, info.stage!, info.subStage!);
                break;
            }

            case Opcodes.Quest.Start: {
                return this.menu.getQuest().handle(info);
            }
        }

        this.menu.getQuests().handle(opcode, info.key);
    }

    /**
     * Packet received from the server containing information about the achievements. When
     * we receive batch data, we relay that to the client. When we receive individual data,
     * we only update the achievement associated with the provided key. After either of the
     * aforementioned occurs, we synchronize the menu.
     * @param opcode What type of action we're taking.
     * @param info Contains individual achievement data or batch data.
     */

    private handleAchievement(opcode: Opcodes.Achievement, info: AchievementPacketData): void {
        switch (opcode) {
            case Opcodes.Achievement.Batch: {
                this.game.player.loadAchievements(info.achievements!);
                break;
            }

            case Opcodes.Achievement.Progress: {
                this.game.player.setAchievement(
                    info.key!,
                    info.stage!,
                    info.name!,
                    info.description!
                );
                break;
            }
        }

        this.menu.getAchievements().handle(opcode, info.key);
    }

    /**
     * Notifications are messages sent from the server that display only on the current
     * player's end. These can either be popups, or chatbox information.
     * @param opcode Tyhe type of the notification.
     * @param info Contains message, title, and colour information.
     */

    private handleNotification(opcode: Opcodes.Notification, info: NotificationPacketData): void {
        switch (opcode) {
            case Opcodes.Notification.Text: {
                let message = info.source ? info.message : Util.formatNotification(info.message);

                if (info.source === 'TRADE') message = Util.formatNotification(message);

                return this.input.chatHandler.add(
                    info.source || 'WORLD',
                    Util.parseMessage(message),
                    info.colour,
                    true
                );
            }

            case Opcodes.Notification.Popup: {
                if (info.soundEffect) this.audio.playSound(info.soundEffect);

                return this.menu
                    .getNotification()
                    .show(
                        Util.parseMessage(Util.formatNotification(info.title!)),
                        Util.parseMessage(Util.formatNotification(info.message)),
                        info.colour!
                    );
            }
        }
    }

    /**
     * Packet that signals to an item instance that it has to start blinking.
     * The blinking is used to indicate that the item is about to despawn.
     * @param instance Instance of the item we are trying to start blinking process.
     */

    private handleBlink(instance: string): void {
        let item = this.entities.get<Item>(instance);

        item?.blink();
    }

    /**
     * The healing packet is called when the player heals their health
     * or mana. It is used to update the HUD and also display the healing
     * special effect.
     * @param info Contains the instance, type of healing (mana or health), and amount.
     */

    private handleHeal(info: HealPacketData): void {
        let character = this.entities.get<Character>(info.instance);

        if (!character) return;

        switch (info.type) {
            case 'hitpoints': {
                this.info.create(Modules.Hits.Heal, info.amount, character.x, character.y);

                character.addEffect(Modules.Effects.Healing);

                if (this.game.player.instance === character.instance) this.audio.playSound('heal');

                break;
            }

            case 'mana': {
                this.info.create(Modules.Hits.Mana, info.amount, character.x, character.y);
                break;
            }
        }

        character.triggerHealthBar();
    }

    /**
     * Receives an experience packet from the server. This syncs up the client
     * with the player's latest information and also displays an appropriate info
     * depending on the type of experience (combat or skill).
     * @param opcode The type of experience we are working with.
     * @param info The amount of experience, level, previous/next experience required
     * for levelling up. The experience values are used to display to the player how
     * much experience they will require and calculate percentages.
     */

    private handleExperience(opcode: Opcodes.Experience, info: ExperiencePacketData): void {
        let player = this.entities.get<Player>(info.instance);

        if (!player) return;

        let isPlayer = player.instance === this.game.player.instance;

        switch (opcode) {
            case Opcodes.Experience.Sync: {
                player.level = info.level!;
                break;
            }

            case Opcodes.Experience.Skill: {
                if (isPlayer)
                    this.info.create(
                        Modules.Hits.Profession,
                        info.amount!,
                        player.x,
                        player.y,
                        false,
                        info.skill,
                        true
                    );

                break;
            }
        }
    }

    /**
     * Receives signal from the server to despawn the player and
     * display the death scroll. This will get called for as long
     * as the player doesn't press the respawn button, regardless
     * of whether or not the player logs out and back in.
     */

    private handleDeath(): void {
        this.audio.playSound('death');

        // Stop player movement
        this.game.player.stop(true);

        // Clear all the statuses.
        this.game.player.removeAllEffects();

        // Remove the minigame interfaces.
        this.game.minigame.reset();

        // Set the player's sprite to the death animation sprite.
        this.game.player.setSprite(this.sprites.getDeath());

        // Stops the player from performing actions.
        this.game.player.teleporting = true;

        // Set health and mana to 0
        this.game.player.setHitPoints(0);
        this.game.player.setMana(0);

        // Stop the music playing.
        this.audio.stopMusic();

        // Perform the death animation.
        this.game.player.animateDeath(() => {
            this.game.entities.unregisterPosition(this.game.player);

            this.game.player.despawn();

            this.app.body.classList.add('death');
        });
    }

    /**
     * Receives the new song to update the audio controller with.
     * @param newSong String of the new song.
     */

    private handleMusic(newSong?: string): void {
        this.audio.playMusic(newSong);
    }

    /**
     * Receives NPC interaction information. In the most general case, this is about
     * an NPC that is dispalying text bubbles to the player. Alternatively, this can
     * be an NPC that shows an UI element (e.g. bank, shop, etc). This may be moved
     * into a separate packet post-refactor.
     * @param opcode They type of interaction we are working with.
     * @param info Contains information about the NPC interaction.
     */

    private handleNPC(opcode: Opcodes.NPC, info: NPCPacketData): void {
        let npc, soundEffect;

        switch (opcode) {
            case Opcodes.NPC.Talk: {
                npc = this.entities.get<NPC>(info.instance!);

                if (!npc) return;

                // Which sound effect to play depending on if conversation is over or not.
                soundEffect = info.text ? 'npc' : 'npc-end';

                this.audio.playSound(soundEffect, npc);

                this.game.player.disableAction = true;

                // Clear npc's bubbles once conversation is over.
                if (!info.text) return this.bubble.clear(npc.instance);

                // Create the bubble containing the text.
                this.bubble.create(npc.instance, info.text);
                this.bubble.setTo(npc.instance, npc.x, npc.y);

                break;
            }

            case Opcodes.NPC.Bank: {
                return this.menu.getBank().show(info.slots!);
            }

            case Opcodes.NPC.Enchant: {
                this.menu.getEnchant().show();
                break;
            }
        }
    }

    /**
     * Restarts the game and reinitializes the player character during
     * the respawning process.
     * @param info Contains the grid x and y coordinates we are transporting
     * the player to following the respawn.
     */

    private handleRespawn(info: RespawnPacketData): void {
        this.game.audio.playSound('revive');

        this.game.player.setGridPosition(info.x, info.y);

        this.camera.centreOn(this.game.player);

        this.game.player.animation = null;
        this.game.player.setSprite(this.game.sprites.get(this.game.player.getSpriteName()));
        this.game.player.idle();

        this.entities.addEntity(this.game.player);

        this.game.player.dead = false;
        this.game.player.teleporting = false;
    }

    /**
     * Handles the logic for trading between two players. Contains information
     * about what is going on and what to do with the interface.
     * @param opcode The type of trade action to perform.
     * @param info Information about the trade.
     */

    private handleTrade(opcode: Opcodes.Trade, info: TradePacketValues): void {
        switch (opcode) {
            case Opcodes.Trade.Open: {
                let { instance } = info as TradePacketData[typeof opcode],
                    otherPlayer = this.entities.get<Player>(instance);

                if (!otherPlayer) return;

                return this.menu.getTrade().show(this.game.player, otherPlayer);
            }

            case Opcodes.Trade.Close: {
                return this.menu.getTrade().hide(true);
            }

            case Opcodes.Trade.Add: {
                let { index, count, key, instance } = info as TradePacketData[typeof opcode];

                return this.menu
                    .getTrade()
                    .add(index, count || 0, key, instance !== this.game.player.instance);
            }

            case Opcodes.Trade.Remove: {
                let { index, instance } = info as TradePacketData[typeof opcode];

                return this.menu.getTrade().remove(index, instance !== this.game.player.instance);
            }

            case Opcodes.Trade.Accept: {
                let { message } = info as TradePacketData[typeof opcode];

                return this.menu
                    .getTrade()
                    .accept(Util.parseMessage(Util.formatNotification(message!)));
            }
        }
    }

    /**
     * Enchant packet used to update the user interface.
     * @param opcode What type of action to perform on the user interface.
     * @param info Contains index and type of item.
     */

    private handleEnchant(opcode: Opcodes.Enchant, info: EnchantPacketData): void {
        switch (opcode) {
            case Opcodes.Enchant.Select: {
                return this.menu.getEnchant().move(info.index, info.isShard);
            }
        }
    }

    /**
     * Unimplemented guild packet.
     */

    private handleGuild(opcode: Opcodes.Guild, info: GuildPacketData): void {
        switch (opcode) {
            case Opcodes.Guild.Login: {
                this.game.player.setGuild(info);
                break;
            }

            case Opcodes.Guild.Join: {
                this.game.player.addGuildMember(info.username!, info.serverId!);
                break;
            }

            case Opcodes.Guild.Rank: {
                this.game.player.setGuildMember(info.username!, info.rank!);
                break;
            }
        }

        this.menu.getGuilds().handle(opcode, info);
    }

    /**
     * Receives pointer information from the server. This can be a pointer at an
     * entity location, or a static pointer. This function will be updated soon.
     * @param opcode What type of pointer we are displaying.
     * @param info Information such as location and instance of the pointer.
     */

    private handlePointer(opcode: Opcodes.Pointer, info: PointerPacketData): void {
        let entity;

        switch (opcode) {
            case Opcodes.Pointer.Entity: {
                entity = this.entities.get(info.instance);

                if (!entity) return;

                this.pointer.create(opcode, info.instance);

                break;
            }

            // Location based pointers stick to one point on the map.
            case Opcodes.Pointer.Location: {
                this.pointer.create(
                    opcode,
                    info.instance,
                    info.x! * this.map.tileSize,
                    info.y! * this.map.tileSize
                );
                break;
            }

            case Opcodes.Pointer.Remove: {
                this.pointer.clean();
                break;
            }
        }
    }

    /**
     * Updates the pvp flag for our client. The actual PVP attacking is handled
     * server-sided. This just allows the client to target another player.
     * @param info Contains the instance and pvp status of an entity.
     */

    private handlePVP(info: PVPPacketData): void {
        this.game.pvp = info.state;

        // Update the viewing for the player's skin and weapon skin.
        this.game.player.updateEquipmentAppearance();
    }

    /**
     * Updates the visual poison status of the player (changes the colour of the health bar).
     * @param type Type of poison we are applying, if -1 then we remove poison status.
     */

    private handlePoison(type: number): void {
        this.game.player.setPoison(type !== -1);
    }

    /**
     * Opens a store with the data from the server. Stores can only be opened
     * when there is data and the server validates that the player is next
     * to the store to prevent cheating.
     * @param opcode The type of action performed on the store.
     * @param info Contains information such as store key and items to update.
     */

    private handleStore(opcode: Opcodes.Store, info: StorePacketData): void {
        switch (opcode) {
            case Opcodes.Store.Open: {
                return this.menu.getStore().show(info);
            }

            case Opcodes.Store.Update: {
                return this.menu.getStore().update(info);
            }

            case Opcodes.Store.Select: {
                return this.menu.getStore().move(info);
            }
        }
    }

    /**
     * Handles the logic for the overlay system. Overlay is generally a mask applied on top
     * of the current viewport to darken the screen. Using that mask we can calculate things
     * such as the lighting effect from a torch for example.
     * @param opcode Contains information about the type of overlay action to perform.
     * @param info Information about the overlay such as the image and colour (or lighting).
     */

    private handleOverlay(opcode: Opcodes.Overlay, info: OverlayPacketData): void {
        switch (opcode) {
            case Opcodes.Overlay.Set: {
                this.overlays.update(info.image);
                this.renderer.updateDarkMask(info.colour);

                this.renderer.addPlayerLight();
                this.renderer.resizeLights();
                break;
            }

            case Opcodes.Overlay.Remove: {
                this.renderer.removeAllLights();
                this.overlays.update();
                break;
            }

            case Opcodes.Overlay.Lamp: {
                this.renderer.addLight(info.light!);
                return;
            }
        }
    }

    /**
     * Handles camera packets such as locking the camera.
     * @param opcode The type of action we are performing with the camera.
     */

    private handleCamera(_opcode: Opcodes.Camera): void {
        //
    }

    /**
     * Contains a bubble packet to display. Bubble packets may be used for
     * a specific entity (given the opcode) or may be assigned to a position
     * to mock an entity. The latter is generally done when the player
     * interacts with objects.
     * @param opcode The type of bubble we are displaying (entity or position).
     * @param info Contains information such as the text and position of the bubble.
     */

    private handleBubble(opcode: Opcodes.Bubble, info: BubblePacketData): void {
        if (!info.text) return this.bubble.clear(info.instance);

        let entity = this.entities.get(info.instance);

        // Check validity of the entity only when the bubble is attached to an entity.
        if (opcode === Opcodes.Bubble.Entity && !entity) return;

        /**
         * This works as following: we create a position object if there is no entity found
         * and we are setting the bubble to a static position. We pass this parameter when
         * we create a blob so that we can mark it as static. We then determine whether
         * to use the position object below given that it exists or not (see the ternary below).
         */
        let position = entity
            ? undefined
            : {
                  x: info.x! * this.map.tileSize,
                  y: info.y! * this.map.tileSize
              };

        // Create the bubble and assign its position.
        this.bubble.create(info.instance, info.text, info.duration, position);
        this.bubble.setTo(
            info.instance,
            position ? position.x : entity.x,
            position ? position.y : entity.y
        );
    }

    /**
     * Updates the skills page with the data from the server.
     * @param info Contains the skill batch data or a specific skill data.
     */

    private handleSkill(opcode: Opcodes.Skill, info: SkillPacketData): void {
        switch (opcode) {
            case Opcodes.Skill.Batch: {
                this.game.player.loadSkills((info as SerializedSkills).skills);
                break;
            }

            case Opcodes.Skill.Update: {
                this.game.player.setSkill(info as SkillData);
                break;
            }
        }

        this.game.menu.synchronize('profile');
    }

    /**
     * Contains an array of entities that we are updating the appearance
     * data of. This includes name colour, scale, and perhaps other things.
     * @param info Array containing the instance and appearance data.
     */

    private handleUpdate(info: EntityDisplayInfo[]): void {
        this.entities.cleanDisplayInfo();

        for (let update of info) {
            let entity = this.entities.get(update.instance);

            // If the entity doesn't exist, we add it to the update queue.
            if (!entity) {
                this.entities.entityUpdateQueue[update.instance] = update;
                continue;
            }

            entity.updateDisplayInfo(update);
        }
    }

    /**
     * Minigame packets contain information about the kind of visuals to display
     * onto the screen. For example, the TeamWar minigame requires the countdown
     * to be displayed in the top of the screen during the lobby sequence, and
     * in the actual game to display the score for both teams. We use this packet
     * to signal to the game client what to display and when.
     * @param info Contains information about the minigame status.
     */

    private handleMinigame(opcode: Opcodes.Minigame, info: MinigamePacketData): void {
        let { minigame, player } = this.game;

        minigame.type = opcode;
        minigame.started = !!info.started;

        if (info.countdown) minigame.countdown = info.countdown;

        switch (info.action) {
            // Game starting packet.
            case Opcodes.MinigameActions.Score: {
                minigame.setScore(info);

                return minigame.setStatus('ingame');
            }

            // Entering lobby packets
            case Opcodes.MinigameActions.End:
            case Opcodes.MinigameActions.Lobby: {
                player.nameColour = '';
                this.pointer.clean();

                return minigame.setStatus('lobby');
            }

            // Exiting the entire minigame
            case Opcodes.MinigameActions.Exit: {
                return minigame.reset();
            }
        }
    }

    /**
     * Effects are special conditions that can be applied to a player or an entity.
     * When a player uses the run ability, we may want to display a special effect on
     * top of modifying their movement speed.
     * @param opcode The type of effect we are applying.
     * @param info Information about the entity we are applying the effect to.
     */

    private handleEffect(opcode: Opcodes.Effect, info: EffectPacketData): void {
        let entity =
            info.instance === this.game.player.instance
                ? this.game.player
                : this.entities.get<Character>(info.instance);

        if (!entity) return;

        switch (opcode) {
            case Opcodes.Effect.Add: {
                return entity.addEffect(info.effect);
            }

            case Opcodes.Effect.Remove: {
                return entity.removeEffect(info.effect);
            }
        }
    }

    /**
     * Handles incoming packets relating to the friends list. This is how
     * we update the client with the latest information about our friends.
     * @param opcode What type of update we are performing.
     * @param info Contains information about the packet we are handling.
     */

    private handleFriends(opcode: Opcodes.Friends, info: FriendsPacketData): void {
        switch (opcode) {
            case Opcodes.Friends.List: {
                this.game.player.loadFriends(info.list!);
                break;
            }

            case Opcodes.Friends.Add: {
                this.game.player.addFriend(info.username!, info.status!, info.serverId!);
                break;
            }

            case Opcodes.Friends.Status: {
                this.game.player.setFriendStatus(info.username!, info.status!, info.serverId!);
                break;
            }
        }

        this.menu.getFriends().handle(opcode, info.username, info.status, info.serverId);
    }

    /**
     * Updates the rank of the current player. Packet contains the new rank.
     * @param rank The new rank we are updating the player to.
     */

    private handleRank(rank: Modules.Ranks): void {
        this.game.player.setRank(rank);
    }

    /**
     * Handles receiving information about crafting. This is used to synchronize the crafting
     * user interface with the server. When a player selects an item to craft this
     * @param opcode Contains the type of crafting action that we want to perform.
     * @param info Contains the information about the crafting action.
     */

    private handleCrafting(opcode: Opcodes.Crafting, info: CraftingPacketData): void {
        this.menu.getCrafting().handle(opcode, info);
    }

    /**
     * Generic packet for receiving interface information. These can be used for a wide
     * variety of interfaces that we want to display to the player (with dynamic information).
     * @param opcode What type of action to perform (open or close the interface).
     * @param info Contains what interface we are acting upon and information about it.
     */

    private handleInterface(opcode: Opcodes.Interface, info: InterfacePacketData): void {
        let menu = this.menu.get(info.identifier);

        // If the interface doesn't exist, we create it.
        if (!menu) return;

        switch (opcode) {
            case Opcodes.Interface.Open: {
                return menu.show(info);
            }
            case Opcodes.Interface.Close: {
                return menu.hide();
            }
        }
    }

    /**
     * Handles incoming packet regarding a loot bag. This just displays the loot bag
     * menu and allows the player to interact with it.
     * @param slots
     */

    private handleLootBag(opcode: Opcodes.LootBag, info: LootBagPacketData): void {
        this.menu.getLootBag().handle(opcode, info);
    }

    /**
     * Handles countdown packet. Used to display a countdown above the player.
     * @param info Contains the instance and the counter information.
     */

    private handleCountdown(info: CountdownPacketData): void {
        let entity = this.entities.get(info.instance);

        if (!entity) return;

        entity.setCountdown(info.time);
    }

    /**
     * Handles the incoming resource packet. We essentially update the exhausted status
     * of the resource based on what the server is telling us.
     * @param info Contains the instance and the state of the resource.
     */

    private handleResource(info: ResourcePacketData): void {
        let entity = this.entities.get(info.instance);

        // Entity either doesn't exist or it's not a resource.
        if (!entity?.isResource()) return;

        let depleted = info.state === Modules.ResourceState.Depleted;

        (entity as Resource).setExhausted(depleted);

        // Update the cursor and silhouette
        this.input.moveCursor();

        if (depleted) entity.updateSilhouette(false);
    }

    /**
     * Compares the epoch between the last entity list update request and current
     * time. This is in order to prevent spams to the server and timeout.
     */

    private canRequestEntityList(): boolean {
        return Date.now() - this.lastEntityListRequest > 5000; // every 2 seconds
    }
}
