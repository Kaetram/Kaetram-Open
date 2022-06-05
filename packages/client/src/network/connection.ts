import _ from 'lodash';

import log from '../lib/log';

import type App from '../app';
import type Storage from '../utils/storage';
import type Overlays from '../renderer/overlays';
import type InfoController from '../controllers/info';
import type Game from '../game';
import type Map from '../map/map';
import type Camera from '../renderer/camera';
import type Renderer from '../renderer/renderer';
import type InputController from '../controllers/input';
import type Socket from './socket';
import type PointerController from '../controllers/pointer';
import type AudioController from '../controllers/audio';
import type EntitiesController from '../controllers/entities';
import type BubbleController from '../controllers/bubble';
import type MenuController from '../controllers/menu';
import type SpritesController from '../controllers/sprites';
import type Messages from './messages';
import type Entity from '../entity/entity';
import type Item from '../entity/objects/item';
import type NPC from '../entity/character/npc/npc';
import type Character from '../entity/character/character';
import type Player from '../entity/character/player/player';

import { inflate } from 'pako';
import { isMobile } from '../utils/detect';
import { PlayerData } from '@kaetram/common/types/player';
import { Packets, Opcodes, Modules } from '@kaetram/common/network';
import { SerializedSkills } from '@kaetram/common/types/skills';
import { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';
import {
    AnimationPacket,
    BubblePacket,
    ChatPacket,
    CombatPacket,
    CommandPacket,
    ContainerPacket,
    EnchantPacket,
    EquipmentPacket,
    ExperiencePacket,
    HealPacket,
    MovementPacket,
    NotificationPacket,
    NPCPacket,
    OverlayPacket,
    PointerPacket,
    PointsPacket,
    QuestPacket,
    RespawnPacket,
    StorePacket,
    TeleportPacket,
    SkillPacket
} from '@kaetram/common/types/messages/outgoing';

export default class Connection {
    /**
     * Keep all game objects as instances in this class
     * in order to cut down on length of code when trying
     * to access them.
     */

    private app: App = this.game.app;
    private storage: Storage = this.app.storage;
    private overlays: Overlays = this.game.overlays;
    private info: InfoController = this.game.info;
    private map: Map = this.game.map;
    private camera: Camera = this.game.camera;
    private renderer: Renderer = this.game.renderer;
    private input: InputController = this.game.input;
    private socket: Socket = this.game.socket;
    private pointer: PointerController = this.game.pointer;
    private audio: AudioController = this.game.audio;
    private entities: EntitiesController = this.game.entities;
    private bubble: BubbleController = this.game.bubble;
    private menu: MenuController = this.game.menu;
    private sprites: SpritesController = this.game.sprites;
    private messages: Messages = this.socket.messages;

    /**
     * Connection controller keeps track of all the incoming packets
     * and reroutes them to their specific function for organization purposes.
     */

    public constructor(private game: Game) {
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
        this.messages.onNotification(this.handleNotification.bind(this));
        this.messages.onBlink(this.handleBlink.bind(this));
        this.messages.onHeal(this.handleHeal.bind(this));
        this.messages.onExperience(this.handleExperience.bind(this));
        this.messages.onDeath(this.handleDeath.bind(this));
        this.messages.onAudio(this.handleAudio.bind(this));
        this.messages.onNPC(this.handleNPC.bind(this));
        this.messages.onRespawn(this.handleRespawn.bind(this));
        this.messages.onEnchant(this.handleEnchant.bind(this));
        this.messages.onGuild(this.handleGuild.bind(this));
        this.messages.onPointer(this.handlePointer.bind(this));
        this.messages.onPVP(this.handlePVP.bind(this));
        this.messages.onStore(this.handleStore.bind(this));
        this.messages.onOverlay(this.handleOverlay.bind(this));
        this.messages.onCamera(this.handleCamera.bind(this));
        this.messages.onBubble(this.handleBubble.bind(this));
        this.messages.onSkill(this.handleSkill.bind(this));
    }

    /**
     * Handles the handshake packet from the server. The handshake signals
     * to the client that the connection is now established and the client
     * must send the login packet (guest, registering, or login).
     */

    private handleHandshake(): void {
        this.app.updateLoader('Connecting to server...');

        // Guest login doesn't require any credentials, send the packet right away.
        if (this.app.isGuest())
            return this.socket.send(Packets.Login, { opcode: Opcodes.Login.Guest });

        let username = this.app.getUsername(),
            password = this.app.getPassword(),
            email = this.app.getEmail();

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
            region = JSON.parse(inflatedString);

        this.map.loadRegions(region);

        this.renderer.forceRendering = true;
        this.renderer.updateAnimatedTiles();
    }

    /**
     * Receives the equipment packet from the server. When we receive batch
     * data from the server we update every equipment slot with the new data.
     * A single equipment is accompanied by a type and serialized slot info.
     * @param opcode Type of equipment packet we are working with.
     * @param info Data containing equipment(s) information.
     */

    private handleEquipment(opcode: Opcodes.Equipment, info: EquipmentPacket): void {
        switch (opcode) {
            case Opcodes.Equipment.Batch:
                _.each((info.data as SerializedEquipment).equipments, (equipment: EquipmentData) =>
                    this.game.player.equip(equipment)
                );
                break;

            case Opcodes.Equipment.Equip:
                this.game.player.equip(info.data as EquipmentData);
                break;

            case Opcodes.Equipment.Unequip:
                this.game.player.unequip(info.type!);
                break;
        }

        this.game.player.sync();
    }

    /**
     * Compares the list of entities from the server and removes any enities that are spawned
     * but no longer contained within the region. This occurs when the player goes from one
     * region to another, and we are queueing up entities for depsawn.
     * @param entities A list of strings that contains the instances of the entities in the region.
     */

    private handleEntityList(entities: string[]): void {
        let ids = _.map(this.entities.getAll(), 'instance'),
            known = _.intersection(ids, entities),
            newIds = _.difference(entities, known);

        // Prepare the entities ready for despawning.
        this.entities.decrepit = _.reject(
            this.entities.getAll(),
            (entity) =>
                _.includes(known, entity.instance) || entity.instance === this.game.player.instance
        );

        // Clear the entities in the decrepit queue.
        this.entities.clean();

        // Send the new id list request to the server.
        this.socket.send(Packets.Who, newIds);
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
        if (!player) return;

        player.load(data);

        if (data.equipments) _.each(data.equipments, player.equip.bind(player));

        player.setSprite(this.game.sprites.get(player.getSpriteName()));
    }

    /**
     * Handles the movement packets. These can either be request to move to a position,
     * a follow request, or a forcibly (optional) stop request. Freeze and stunned states
     * also get sent alongside the movement packets.
     * @param opcode The type of movement we are dealing with.
     * @param info Information such as instance and coordinates of the entity that is moving.
     */

    private handleMovement(opcode: Opcodes.Movement, info: MovementPacket): void {
        let entity = this.entities.get<Character>(info.instance),
            target: Entity;

        // Couldn't find and entity with the specified instance.
        if (!entity) return;

        switch (opcode) {
            case Opcodes.Movement.Move:
                if (info.forced) entity.stop(true);

                entity.go(info.x!, info.y!);
                break;

            case Opcodes.Movement.Follow:
                target = this.entities.get<Character>(info.target!);

                if (target) entity.follow(target);

                break;

            case Opcodes.Movement.Stop:
                if (info.forced) entity.stop(true);
                break;

            case Opcodes.Movement.Freeze:
                if (info.state) entity.stop(false);

                entity.frozen = !!info.state;
                break;

            case Opcodes.Movement.Stunned:
                if (info.state) entity.stop(false);

                entity.stunned = !!info.state;
                break;

            case Opcodes.Movement.Orientate:
                entity.performAction(info.orientation!, Modules.Actions.Orientate);
                break;
        }
    }

    /**
     * Handler for the teleportation packet. Used when a player entity
     * teleports to a new location.
     * @param info Instance of the entity, x and y coordinates, and whether to animate.
     */

    private handleTeleport(info: TeleportPacket): void {
        let player = this.entities.get<Player>(info.instance);

        if (!player) return;

        // If the player is the same as our main player.
        let currentPlayer = player.instance === this.game.player.instance;

        // Stop and freeze the player until teleprtation is complete.
        player.stop(true);
        player.frozen = true;

        // Clears all bubbles when our main player teleports.
        if (currentPlayer) this.bubble.clean();
        else this.bubble.clear(player.instance); // Clears bubble of teleporting player.

        console.log(info);

        // No animation, skip straight to teleporting.
        if (!info.withAnimation) return this.game.teleport(player, info.x!, info.y!);

        // Copy the player's sprite temporarily.
        let playerSprite = player.sprite;

        // Prevent rendering of the sword.
        player.teleporting = true;

        // Set the player's sprite to the death animation sprite.
        player.setSprite(this.sprites.getDeath());

        player.animateDeath(() => {
            this.game.teleport(player, info.x!, info.y!);

            // Reset the animation.
            player.animation = null;

            // Restore the player's sprite.
            player.setSprite(playerSprite);
            player.idle();

            player.teleporting = false;
        }, 240);
    }

    /**
     * Handler for when we want to despawn an entity.
     * @param instance Instance of the entity we are removing.
     */

    private handleDespawn(instance: string): void {
        let entity = this.entities.get<Character>(instance);

        // Could not find the entity.
        if (!entity) return;

        // Handle item despawn separately here.
        if (entity.isItem()) return this.entities.removeItem(entity);

        // Handle chest and animations here.
        if (entity.isChest()) return this.entities.removeChest(entity);

        // Despawn the entity.
        entity.despawn();

        // Removes bubbles from the entity.
        this.bubble.clear(entity.instance);

        // CLears our client's target.
        if (this.game.player.hasTarget(entity)) this.game.player.removeTarget();

        // Plays a random kill sound if the game client player is nearby.
        if (this.game.player.getDistance(entity) <= 7) this.audio.playKill();

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

    private handleCombat(opcode: Opcodes.Combat, info: CombatPacket): void {
        let attacker = this.entities.get<Character>(info.instance),
            target = this.entities.get<Character>(info.target);

        // Could not find the attacker or target.
        if (!attacker || !target) return;

        // TODO - Decide whether to simplify combat packet this much.
        if (opcode !== Opcodes.Combat.Hit) return;

        // Check if our client's player is the target or the attacker.
        let currentPlayerTarget = target.instance === this.game.player.instance,
            currentPlayerAttacker = attacker.instance === this.game.player.instance;

        // Set the terror effect onto the target.
        if (info.hit.terror) target.terror = true;

        // Perform the critical effect onto the target.
        if (info.hit.type === Modules.Hits.Critical) target.critical = true;

        // Perform the attack animation if the damage type isn't from AOE or poison.
        if (!info.hit.aoe && !info.hit.poison) {
            attacker.lookAt(target);
            attacker.performAction(attacker.orientation, Modules.Actions.Attack);
        }

        // If the game client player is the attacker, we play the hit sound effect.
        if (currentPlayerAttacker && info.hit.damage > 0) this.audio.playHit();

        // Play the hurt sound effect if the client player is the target.
        if (currentPlayerTarget && info.hit.damage > 0) this.audio.playHurt();

        // Create the hit info to be displayed above the entity.
        this.info.create(info.hit.type, info.hit.damage, target.x, target.y, currentPlayerTarget);

        // Flash the target character when a hit occurs.
        if (target.hurtSprite) target.toggleHurt();

        // Show the health bar for both entities.
        attacker.triggerHealthBar();
        target.triggerHealthBar();
    }

    /**
     * Animates a character based on the provided instance.
     * @param info Contains instance and what animation to perform.
     */

    private handleAnimation(info: AnimationPacket): void {
        let character = this.entities.get<Character>(info.instance);

        if (!character) return;

        character.performAction(character.orientation, info.action);
    }

    /**
     * Handles the points packet. Used when a player is being hit
     * or heals their hit points or mana.
     * @param info Contains the player instance, hit points, and mana.
     */

    private handlePoints(info: PointsPacket): void {
        let character = this.entities.get<Player>(info.instance);

        if (!character) return;

        if (info.mana) return character.setMana(info.mana);

        if (!info.hitPoints) return;

        character.setHitPoints(info.hitPoints);
        this.input.hud.updateCallback?.(info.instance, info.hitPoints);
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

    private handleChat(info: ChatPacket): void {
        // Messages with source are static, we add them directly to the chatbox.
        if (info.source) return this.input.chatHandler.add(info.source, info.message, info.colour);

        let entity = this.entities.get<Character>(info.instance!);

        if (!entity) return;

        // Add to the chatbox, if global, we prefix it to the entity's name.
        this.input.chatHandler.add(entity.name, info.message, info.colour);

        // Draw bubble and play audio.
        if (info.withBubble) {
            this.bubble.create(info.instance!, info.message);
            this.bubble.setTo(info.instance!, entity.x, entity.y);

            this.audio.play(Modules.AudioTypes.SFX, 'npctalk');
        }
    }

    /**
     * Hardcoded administrative commands built into the client. When a player
     * types a special command, the server checks against the player's rights
     * before sending this packet. These are merely debugging/graphical tests.
     * @param info Packet contains the command string.
     */

    private handleCommand(info: CommandPacket): void {
        switch (info.command) {
            case 'debug':
                this.renderer.debugging = !this.renderer.debugging;
                return;

            case 'toggleheal':
                this.game.player.healing = true;
                break;

            case 'toggleterror':
                this.game.player.terror = true;
                break;
        }
    }

    /**
     * Receives container information (bank or inventory for now) and updates it.
     * @param opcode What type of container action we are working with.
     * @param info Contains array of serialized slots, a single slot, and type of container.
     */

    private handleContainer(opcode: Opcodes.Container, info: ContainerPacket): void {
        let container =
            info.type === Modules.ContainerType.Inventory
                ? this.menu.getInventory()
                : this.menu.getBank();

        switch (opcode) {
            case Opcodes.Container.Batch:
                return container.batch(info.data!.slots);

            case Opcodes.Container.Add:
                container.add(info.slot!);
                break;

            case Opcodes.Container.Remove:
                container.remove(info.slot!);
                break;
        }

        // Synchronizes all the open menus that have containers.
        this.menu.synchronize();
    }

    /**
     * Unhandled function. This will be used when player
     * special abilities are finally implemented.
     */

    private handleAbility(): void {
        log.debug('Unhandled ability packet.');
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

    private handleQuest(opcode: Opcodes.Quest, info: QuestPacket): void {
        // switch (opcode) {
        //     case Opcodes.Quest.Batch:
        //         return this.menu.getQuestPage().loadQuests(info.data!.quests);
        //     case Opcodes.Quest.Progress:
        //         return this.menu.getQuestPage().progress(info);
        // }
    }

    /**
     * Notifications are messages sent from the server that display only on the current
     * player's end. These can either be popups, or chatbox information.
     * @param opcode Tyhe type of the notification.
     * @param info Contains message, title, and colour information.
     */

    private handleNotification(opcode: Opcodes.Notification, info: NotificationPacket): void {
        switch (opcode) {
            case Opcodes.Notification.Text:
                return this.input.chatHandler.add('WORLD', info.message, info.colour, true);
        }

        // switch (opcode) {
        //     case Opcodes.Notification.Ok:
        //         this.menu.displayNotify(info.message);
        //         break;
        //     case Opcodes.Notification.YesNo:
        //         this.menu.displayConfirm(info.message);
        //         break;
        //     case Opcodes.Notification.Text:
        //         this.input.chatHandler.add('WORLD', info.message, info.colour, true);
        //         break;
        //     case Opcodes.Notification.Popup:
        //         this.menu.showNotification(info.title!, info.message, info.colour!);
        //         break;
        // }
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

    private handleHeal(info: HealPacket): void {
        let character = this.entities.get<Character>(info.instance!);

        if (!character) return;

        switch (info.type) {
            case 'health':
                this.info.create(Modules.Hits.Heal, info.amount, character.x, character.y);

                this.game.player.healing = true;

                break;

            case 'mana':
                this.info.create(Modules.Hits.Mana, info.amount, character.x, character.y);
                break;
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

    private handleExperience(opcode: Opcodes.Experience, info: ExperiencePacket): void {
        let player = this.entities.get<Player>(info.instance);

        if (!player) return;

        let isPlayer = player.instance === this.game.player.instance;

        switch (opcode) {
            case Opcodes.Experience.Combat: {
                /**
                 * We only receive level information about other entities.
                 */
                if (player.level !== info.level) {
                    player.level = info.level!;
                    this.info.create(Modules.Hits.LevelUp, 0, player.x, player.y);
                }

                /**
                 * When we receive experience information about our own player
                 * we update the experience bar and create an info.
                 */

                console.log(info);

                if (isPlayer) {
                    this.game.player.setExperience(
                        info.experience!,
                        info.nextExperience!,
                        info.prevExperience!
                    );

                    this.info.create(Modules.Hits.Experience, info.amount, player.x, player.y);
                }

                //this.menu.profile.update();

                break;
            }

            case Opcodes.Experience.Skill:
                if (isPlayer)
                    this.info.create(Modules.Hits.Profession, info.amount, player.x, player.y);

                break;
        }
    }

    /**
     * Receives signal from the server to despawn the player and
     * display the death scroll. This will get called for as long
     * as the player doesn't press the respawn button, regardless
     * of whether or not the player logs out and back in.
     */

    private handleDeath(): void {
        this.audio.stop();

        this.game.player.despawn();

        this.app.body.addClass('death');
    }

    /**
     * Receives the new song to update the audio controller with.
     * @param newSong String of the new song.
     */

    private handleAudio(newSong: string): void {
        if (isMobile()) return;

        this.audio.newSong = newSong;

        this.audio.update();
    }

    /**
     * Receives NPC interaction information. In the most general case, this is about
     * an NPC that is dispalying text bubbles to the player. Alternatively, this can
     * be an NPC that shows an UI element (e.g. bank, shop, etc). This may be moved
     * into a separate packet post-refactor.
     * @param opcode They type of interaction we are working with.
     * @param info Contains information about the NPC interaction.
     */

    private handleNPC(opcode: Opcodes.NPC, info: NPCPacket): void {
        let npc, soundEffect;

        switch (opcode) {
            case Opcodes.NPC.Talk:
                npc = this.entities.get<NPC>(info.instance!);

                if (!npc) return;

                // Which sound effect to play depending on if conversation is over or not.
                soundEffect = info.text ? 'npc' : 'npc-end';

                this.audio.play(Modules.AudioTypes.SFX, soundEffect);

                this.game.player.disableAction = true;

                // Clear npc's bubbles once conversation is over.
                if (!info.text) return this.bubble.clear(npc.instance);

                // Create the bubble containing the text.
                this.bubble.create(npc.instance, info.text!);
                this.bubble.setTo(npc.instance, npc.x, npc.y);

                break;

            case Opcodes.NPC.Bank:
                return this.menu.getBank().show(info.slots!);

            case Opcodes.NPC.Enchant:
                //this.menu.enchant.display();
                break;
        }
    }

    /**
     * Restarts the game and reinitializes the player character during
     * the respawning process.
     * @param info Contains the grid x and y coordinates we are transporting
     * the player to following the respawn.
     */

    private handleRespawn(info: RespawnPacket): void {
        this.game.player.setGridPosition(info.x, info.y);

        this.entities.registerPosition(this.game.player);

        this.camera.centreOn(this.game.player);

        this.game.player.animation = null;
        this.game.player.setSprite(this.game.sprites.get(this.game.player.getSpriteName()));
        this.game.player.idle();

        this.entities.addEntity(this.game.player);

        this.game.player.dead = false;
    }

    /**
     * Enchant packet used to update the user interface.
     * @param opcode What type of action to perform on the user interface.
     * @param info Contains index and type of item.
     */

    private handleEnchant(opcode: Opcodes.Enchant, info: EnchantPacket): void {
        switch (opcode) {
            case Opcodes.Enchant.Select:
                //this.menu.enchant.add(info.type!, info.index!);
                break;

            case Opcodes.Enchant.Remove:
                //this.menu.enchant.moveBack(info.type!, info.index);
                break;
        }
    }

    /**
     * Unimplemented guild packet.
     */

    private handleGuild(opcode: Opcodes.Guild): void {
        log.debug(`Guild Opcode: ${opcode}`);
    }

    /**
     * Receives pointer information from the server. This can be a pointer at an
     * entity location, or a static pointer. This function will be updated soon.
     * @param opcode What type of pointer we are displaying.
     * @param info Information such as location and instance of the pointer.
     */

    private handlePointer(opcode: Opcodes.Pointer, info: PointerPacket): void {
        let entity;

        switch (opcode) {
            case Opcodes.Pointer.Entity:
                entity = this.entities.get(info.instance!);

                if (!entity) return;

                this.pointer.create(entity.instance, opcode);
                this.pointer.setToEntity(entity);

                break;

            case Opcodes.Pointer.Location:
                this.pointer.create(info.instance, opcode);
                this.pointer.setToPosition(info.instance, info.x! * 16, info.y! * 16);

                break;

            case Opcodes.Pointer.Relative:
                this.pointer.create(info.instance, opcode);
                this.pointer.setRelative(info.instance, info.x!, info.y!);
                break;

            case Opcodes.Pointer.Remove:
                this.pointer.clean();
                break;

            case Opcodes.Pointer.Button:
                this.pointer.create(info.instance!, opcode, info.button!);
                break;
        }
    }

    /**
     * Updates the PVP status of an entity or our own player character.
     * @param instance Used to identify which entity to update.
     * @param state The state of the PVP.
     */

    private handlePVP(instance: string, state: boolean): void {
        if (instance === this.game.player.instance) {
            this.game.pvp = state;
            return;
        }

        let entity = this.entities.get<Player>(instance);

        if (entity) entity.pvp = state;
    }

    /**
     * Opens a store with the data from the server. Stores can only be opened
     * when there is data and the server validates that the player is next
     * to the store to prevent cheating.
     * @param opcode The type of action performed on the store.
     * @param info Contains information such as store key and items to update.
     */

    private handleStore(opcode: Opcodes.Store, info: StorePacket): void {
        switch (opcode) {
            case Opcodes.Store.Open:
                return this.menu.getStore().show(info);

            case Opcodes.Store.Update:
                return this.menu.getStore().update(info);

            case Opcodes.Store.Select:
                return this.menu.getStore().move(info);
        }
    }

    /**
     *
     * @param opcode
     * @param info
     */

    private handleOverlay(opcode: Opcodes.Overlay, info: OverlayPacket): void {
        console.log(info);

        switch (opcode) {
            case Opcodes.Overlay.Set: {
                // let { image, colour } = info as OverlaySetData;

                // this.overlays.update(image);

                // if (!this.renderer.transitioning) this.renderer.updateDarkMask(colour);
                // else this.queueColour = colour;

                break;
            }

            case Opcodes.Overlay.Remove:
                this.renderer.removeAllLights();
                this.overlays.update();

                break;

            case Opcodes.Overlay.Lamp: {
                // let { x, y, distance, diffuse, objects } = info as OverlayLampData;

                // this.renderer.addLight(
                //     x,
                //     y,
                //     distance!,
                //     diffuse!,
                //     'rgba(0,0,0,0.4)',
                //     true,
                //     objects!
                // );

                break;
            }

            case Opcodes.Overlay.RemoveLamps:
                this.renderer.removeAllLights();

                break;

            case Opcodes.Overlay.Darkness: {
                // let { colour } = info as OverlayDarknessData;

                // this.renderer.updateDarkMask(colour);

                break;
            }
        }
    }

    /**
     * Handles camera packets such as locking the camera.
     * @param opcode The type of action we are performing with the camera.
     */

    private handleCamera(opcode: Opcodes.Camera): void {
        //
    }

    /**
     *
     * @param info
     */

    private handleBubble(info: BubblePacket): void {
        if (!info.text) return this.bubble.clear(info.instance);

        this.bubble.create(info.instance, info.text, info.duration);
        this.bubble.setTo(info.instance, info.x!, info.y!);
    }

    /**
     * Updates the skills page with the data from the server.
     * @param info Contains the skill batch data or a specific skill data.
     */

    private handleSkill(opcode: Opcodes.Skill, info: SkillPacket): void {
        switch (opcode) {
            case Opcodes.Skill.Batch:
                this.game.player.loadSkills((info as SerializedSkills).skills);
                break;
        }

        this.game.menu.synchronize();
    }
}
