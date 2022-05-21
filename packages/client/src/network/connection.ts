import _ from 'lodash';

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
import type Messages from './messages';
import type Player from '../entity/character/player/player';
import type Character from '../entity/character/character';

import { PlayerData } from '@kaetram/common/types/player';
import { Packets, Opcodes, Modules } from '@kaetram/common/network';
import { EquipmentPacket, MovementPacket } from '@kaetram/common/types/messages/outgoing';
import { EquipmentData, SerializedEquipment } from '@kaetram/common/types/equipment';

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
    private messages: Messages = this.socket.messages;

    /**
     * Connection controller keeps track of all the incoming packets
     * and reroutes them to their specific function for organization purposes.
     */

    public constructor(private game: Game) {
        this.messages.onHandshake(this.handleHandshake.bind(this));
        this.messages.onWelcome(this.handleWelcome.bind(this));
        this.messages.onEquipment(this.handleEquipment.bind(this));
        this.messages.onSpawn(this.entities.create.bind(this.entities));
        this.messages.onEntityList(this.handleEntityList.bind(this));
        this.messages.onSync(this.handleSync.bind(this));
        this.messages.onMovement(this.handleMovement.bind(this));
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
        this.menu.loadHeader();

        this.game.player.load(data);

        this.game.start();
        this.game.postLoad();

        this.menu.loadProfile();
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

        this.menu.profile.update();
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

        this.menu.profile.update();
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

    // private load(): void {

    //     this.messages.onTeleport((info) => {
    //         let entity = this.entities.get<Player>(info.id),
    //             isPlayer = info.id === this.game.player.instance;

    //         if (!entity) return;

    //         entity.stop(true);
    //         entity.frozen = true;

    //         if (isPlayer) this.bubble.clean();
    //         else this.bubble.clear(info.id);

    //         /**
    //          * Teleporting an entity seems to cause a glitch with the
    //          * hitbox. Make sure you keep an eye out for this.
    //          */

    //         let doTeleport = () => {
    //             this.entities.unregisterPosition(entity);
    //             entity.setGridPosition(info.x, info.y);

    //             if (isPlayer) {
    //                 this.game.player.clearHealthBar();
    //                 this.game.camera.centreOn(entity);
    //                 this.renderer.updateAnimatedTiles();
    //             }

    //             this.entities.registerPosition(entity);
    //             entity.frozen = false;
    //         };

    //         if (info.withAnimation) {
    //             let originalSprite = entity.sprite;

    //             entity.teleporting = true;

    //             entity.setSprite(this.game.sprites.get('death'));

    //             entity.animate('death', 240, 1, () => {
    //                 doTeleport();

    //                 entity.animation = null;

    //                 entity.setSprite(originalSprite);
    //                 entity.idle();

    //                 entity.teleporting = false;
    //             });
    //         } else doTeleport();

    //         // this.renderer.transition(15, false, () => {
    //         //     if (this.queueColour) {
    //         //         this.renderer.updateDarkMask(this.queueColour);
    //         //         this.queueColour = null;
    //         //     }
    //         // });
    //     });

    //     this.messages.onDespawn((id) => {
    //         let entity = this.entities.get<Character>(id);

    //         if (!entity) return;

    //         switch (entity.type) {
    //             case Modules.EntityType.Item:
    //                 this.entities.removeItem(entity);

    //                 return;

    //             case Modules.EntityType.Chest:
    //                 entity.setSprite(this.game.sprites.get('death'));

    //                 entity.setAnimation('death', 120, 1, () => {
    //                     this.entities.unregisterPosition(entity);
    //                     delete this.entities.entities[entity.instance];
    //                 });

    //                 return;
    //         }

    //         entity.dead = true;

    //         entity.stop();

    //         this.bubble.clear(entity.instance);

    //         if (this.game.player.target && this.game.player.target.instance === entity.instance)
    //             this.game.player.removeTarget();

    //         if (
    //             entity.instance !== this.game.player.instance &&
    //             this.game.player.getDistance(entity) < 5
    //         )
    //             this.audio.play(
    //                 Modules.AudioTypes.SFX,
    //                 `kill${Math.floor(Math.random() * 2 + 1) as 1 | 2}` as const
    //             );

    //         entity.hitPoints = 0;

    //         if (!entity.sprite.hasDeathAnimation) entity.setSprite(this.game.sprites.get('death'));

    //         entity.animate('death', 120, 1, () => {
    //             this.entities.unregisterPosition(entity);
    //             delete this.entities.entities[entity.instance];
    //         });
    //     });

    //     this.messages.onCombat((opcode, info) => {
    //         let attacker = this.entities.get<Character>(info.instance),
    //             target = this.entities.get<Character>(info.target!);

    //         if (!attacker || !target) return;

    //         switch (opcode) {
    //             case Opcodes.Combat.Hit: {
    //                 let isPlayer = target.instance === this.game.player.instance;

    //                 if (!info.hit.aoe && !info.hit.poison) {
    //                     attacker.lookAt(target);
    //                     attacker.performAction(attacker.orientation, Modules.Actions.Attack);
    //                 } else if (info.hit.terror) target.terror = true;

    //                 switch (info.hit.type) {
    //                     case Modules.Hits.Critical:
    //                         target.critical = true;

    //                         break;

    //                     default:
    //                         if (
    //                             attacker.instance === this.game.player.instance &&
    //                             info.hit.damage > 0
    //                         )
    //                             this.audio.play(
    //                                 Modules.AudioTypes.SFX,
    //                                 `hit${Math.floor(Math.random() * 2 + 1)}` as 'hit1' | 'hit2'
    //                             );

    //                         break;
    //                 }

    //                 this.info.create(info.hit.type, info.hit.damage, target.x, target.y, isPlayer);

    //                 if (target.hurtSprite) {
    //                     target.sprite = target.hurtSprite;
    //                     window.setTimeout(() => {
    //                         target.sprite = target.normalSprite;
    //                     }, 75);
    //                 }

    //                 attacker.triggerHealthBar();
    //                 target.triggerHealthBar();

    //                 if (isPlayer && info.hit.damage > 0)
    //                     this.audio.play(Modules.AudioTypes.SFX, 'hurt');
    //             }
    //         }
    //     });

    //     this.messages.onAnimation((info: AnimationPacket) => {
    //         let character = this.entities.get<Character>(info.instance);

    //         if (!character) return;

    //         character.performAction(character.orientation, info.action);
    //     });

    //     this.messages.onProjectile((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.Projectile.Create:
    //                 this.entities.create(info as never);
    //                 break;
    //         }
    //     });

    //     this.messages.onPopulation((population) => {
    //         this.population = population;
    //     });

    //     this.messages.onPoints((data) => {
    //         let entity = this.entities.get<Player>(data.id);

    //         if (!entity) return;

    //         if (data.hitPoints) {
    //             entity.setHitPoints(data.hitPoints);

    //             this.input.hud.updateCallback?.(entity.instance, data.hitPoints);
    //         }

    //         if (data.mana) entity.setMana(data.mana);
    //     });

    //     this.messages.onNetwork(() => this.socket.send(Packets.Network, [Opcodes.Network.Pong]));

    //     this.messages.onChat((info) => {
    //         // Messages with source are static, we add them directly to the chatbox.
    //         if (info.source)
    //             return this.input.chatHandler.add(info.source, info.message, info.colour);

    //         let entity = this.entities.get<Character>(info.instance!);

    //         if (!entity) return;

    //         // Add to the chatbox, if global, we prefix it to the entity's name.
    //         this.input.chatHandler.add(
    //             `${info.global ? '[Global]:' : ''} ${entity.name}`,
    //             info.message,
    //             info.colour
    //         );

    //         // Draw bubble and play audio.
    //         if (info.withBubble) {
    //             this.bubble.create(info.instance!, info.message);
    //             this.bubble.setTo(info.instance!, entity.x, entity.y);

    //             this.audio.play(Modules.AudioTypes.SFX, 'npctalk');
    //         }
    //     });

    //     this.messages.onCommand((info) => {
    //         /**
    //          * This is for random miscellaneous commands that require
    //          * a specific action done by the client as opposed to
    //          * packet-oriented ones.
    //          */

    //         log.info(info);

    //         switch (info.command) {
    //             case 'debug':
    //                 this.renderer.debugging = !this.renderer.debugging;
    //                 break;

    //             case 'toggleheal':
    //                 log.info('llll');
    //                 this.game.player.healing = true;
    //                 break;
    //         }
    //     });

    //     this.messages.onContainer((opcode, info) => {
    //         let containerType: Modules.ContainerType = info.type,
    //             container =
    //                 containerType === Modules.ContainerType.Inventory
    //                     ? this.menu.inventory
    //                     : this.menu.bank;

    //         switch (opcode) {
    //             case Opcodes.Container.Batch: {
    //                 let { slots } = info as ContainerBatchData;
    //                 container.load(slots);
    //                 break;
    //             }

    //             case Opcodes.Container.Add: {
    //                 let { slot } = info as ContainerAddData;
    //                 container.add(slot);

    //                 this.menu.bank.add(slot, containerType);
    //                 break;
    //             }

    //             case Opcodes.Container.Drop: {
    //                 let { slot } = info as ContainerRemoveData;
    //                 container.remove(slot, containerType);

    //                 this.menu.bank.remove(slot, containerType);
    //                 break;
    //             }
    //         }
    //     });

    //     // this.messages.onAbility((opcode, info) => {});

    //     this.messages.onQuest((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.Quest.Batch:
    //                 return this.menu.getQuestPage().loadQuests(info as QuestBatchData);

    //             case Opcodes.Quest.Progress:
    //                 return this.menu.getQuestPage().progress(info as QuestProgressData);
    //         }
    //     });

    //     this.messages.onNotification((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.Notification.Ok:
    //                 this.menu.displayNotify(info.message);

    //                 break;

    //             case Opcodes.Notification.YesNo:
    //                 this.menu.displayConfirm(info.message);

    //                 break;

    //             case Opcodes.Notification.Text:
    //                 this.input.chatHandler.add('WORLD', info.message, info.colour, true);

    //                 break;

    //             case Opcodes.Notification.Popup:
    //                 this.menu.showNotification(info.title!, info.message, info.colour!);

    //                 break;
    //         }
    //     });

    //     this.messages.onBlink((instance) => {
    //         let item = this.entities.get<Item>(instance);

    //         item?.blink(150);
    //     });

    //     this.messages.onHeal((info) => {
    //         let entity = this.entities.get<Character>(info.id);

    //         if (!entity) return;

    //         /**
    //          * Healing just triggers an info to display.
    //          */

    //         switch (info.type) {
    //             case 'health':
    //                 this.info.create(Modules.Hits.Heal, info.amount, entity.x, entity.y);

    //                 this.game.player.healing = true;

    //                 break;

    //             case 'mana':
    //                 this.info.create(Modules.Hits.Mana, info.amount, entity.x, entity.y);

    //                 break;
    //         }

    //         entity.triggerHealthBar();
    //     });

    //     this.messages.onExperience((opcode, info) => {
    //         let entity = this.entities.get(info.id);

    //         switch (opcode) {
    //             case Opcodes.Experience.Combat: {
    //                 if (!entity || !entity.isPlayer()) return;

    //                 let data = info as ExperienceCombatData;

    //                 /**
    //                  * We only receive level information about other entities.
    //                  */
    //                 if (entity.level !== data.level) {
    //                     entity.level = data.level;
    //                     this.info.create(Modules.Hits.LevelUp, 0, entity.x, entity.y);
    //                 }

    //                 /**
    //                  * When we receive experience information about our own player
    //                  * we update the experience bar and create an info.
    //                  */

    //                 if (entity.instance === this.game.player.instance) {
    //                     if (info.id === this.game.player.instance)
    //                         this.game.player.setExperience(
    //                             data.experience,
    //                             data.nextExperience!,
    //                             data.prevExperience
    //                         );

    //                     this.info.create(Modules.Hits.Experience, info.amount, entity.x, entity.y);
    //                 }

    //                 this.menu.profile.update();

    //                 break;
    //             }

    //             case Opcodes.Experience.Skill:
    //                 if (!entity || !entity.isPlayer()) return;

    //                 if (entity.instance === this.game.player.instance)
    //                     this.info.create(Modules.Hits.Profession, info.amount, entity.x, entity.y);

    //                 break;
    //         }
    //     });

    //     this.messages.onDeath((id) => {
    //         let entity = this.entities.get(id);

    //         if (!entity || id !== this.game.player.instance) return;

    //         this.audio.stop();

    //         // this.audio.play(Modules.AudioTypes.SFX, 'death');

    //         this.game.player.dead = true;
    //         this.game.player.removeTarget();
    //         this.game.player.orientation = Modules.Orientation.Down;

    //         this.app.body.addClass('death');
    //     });

    //     this.messages.onAudio((newSong) => {
    //         this.audio.newSong = newSong;

    //         if (!this.audio.newSong || Detect.isMobile()) return;

    //         this.audio.update();
    //     });

    //     this.messages.onNPC((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.NPC.Talk: {
    //                 let data = info as NPCTalkData,
    //                     entity = this.entities.get(data.id!),
    //                     message = data.text,
    //                     isNPC = !data.nonNPC;

    //                 if (!entity) return;

    //                 let sound!: 'npc' | 'npc-end';

    //                 if (isNPC)
    //                     if (!message) {
    //                         sound = 'npc-end';
    //                         this.bubble.clear(data.id!);
    //                     } else {
    //                         sound = 'npc';

    //                         this.bubble.create(data.id!, message);

    //                         this.bubble.setTo(data.id!, entity.x, entity.y);

    //                         if (this.renderer.mobile && this.renderer.autoCentre)
    //                             this.camera.centreOn(this.game.player);
    //                     }
    //                 else {
    //                     this.bubble.create(data.id!, message!, this.time);
    //                     this.bubble.setTo(data.id!, entity.x, entity.y);
    //                 }

    //                 this.audio.play(Modules.AudioTypes.SFX, sound);

    //                 this.game.player.disableAction = true;

    //                 break;
    //             }

    //             case Opcodes.NPC.Bank: {
    //                 let { slots } = info as NPCBankData;

    //                 console.log(info);

    //                 this.menu.bank.load(slots);

    //                 this.menu.bank.display();
    //                 break;
    //             }

    //             case Opcodes.NPC.Enchant:
    //                 this.menu.enchant.display();
    //                 break;

    //             case Opcodes.NPC.Countdown: {
    //                 let data = info as NPCCountdownData,
    //                     cEntity = this.entities.get(data.id),
    //                     { countdown } = data;

    //                 cEntity?.setCountdown(countdown);

    //                 break;
    //             }
    //         }
    //     });

    //     this.messages.onRespawn((info) => {
    //         let { instance, x, y } = info;

    //         if (instance !== this.game.player.instance) {
    //             log.error('Player id mismatch.');
    //             return;
    //         }

    //         this.game.player.setGridPosition(x, y);
    //         this.entities.registerPosition(this.game.player);
    //         this.game.camera.centreOn(this.game.player);

    //         this.game.player.animation = null;
    //         this.game.player.setSprite(this.game.sprites.get(this.game.player.getSpriteName()));
    //         this.game.player.idle();

    //         this.entities.addEntity(this.game.player);

    //         this.game.player.dead = false;
    //     });

    //     this.messages.onEnchant((opcode, info) => {
    //         let { type, index } = info;

    //         switch (opcode) {
    //             case Opcodes.Enchant.Select:
    //                 this.menu.enchant.add(type, index);

    //                 break;

    //             case Opcodes.Enchant.Remove:
    //                 this.menu.enchant.moveBack(type, index);

    //                 break;
    //         }
    //     });

    //     this.messages.onGuild((opcode) => {
    //         switch (opcode) {
    //             case Opcodes.Guild.Create:
    //                 break;

    //             case Opcodes.Guild.Join:
    //                 break;
    //         }
    //     });

    //     this.messages.onPointer((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.Pointer.Entity: {
    //                 let entity = this.entities.get(info.instance!);

    //                 if (!entity) return;

    //                 this.pointer.create(entity.instance, opcode);
    //                 this.pointer.setToEntity(entity);

    //                 break;
    //             }

    //             case Opcodes.Pointer.Location: {
    //                 let data = info as PointerLocationData;

    //                 this.pointer.create(data.instance, opcode);
    //                 this.pointer.setToPosition(data.instance, data.x * 16, data.y * 16);

    //                 break;
    //             }

    //             case Opcodes.Pointer.Relative: {
    //                 let data = info as PointerRelativeData;

    //                 this.pointer.create(data.instance, opcode);
    //                 this.pointer.setRelative(data.instance, data.x, data.y);

    //                 break;
    //             }

    //             case Opcodes.Pointer.Remove:
    //                 this.pointer.clean();
    //                 break;

    //             case Opcodes.Pointer.Button: {
    //                 let data = info as PointerButtonData;

    //                 this.pointer.create(data.instance, opcode, data.button);

    //                 break;
    //             }
    //         }
    //     });

    //     this.messages.onPVP((id, pvp) => {
    //         if (this.game.player.instance === id) this.game.pvp = pvp;
    //         else {
    //             let entity = this.entities.get(id);

    //             if (entity) entity.pvp = pvp;
    //         }
    //     });

    //     this.messages.onStore((opcode, info) => {
    //         let { shop } = this.menu;

    //         switch (opcode) {
    //             case Opcodes.Store.Open:
    //             case Opcodes.Store.Update:
    //                 return shop.open(info as SerializedStoreInfo);

    //             case Opcodes.Store.Select:
    //                 return shop.move(info.item!);
    //         }

    //         // let { shop } = this.menu;

    //         // switch (opcode) {
    //         //     case Opcodes.Store.Open: {
    //         //         let { shopData } = info as ShopOpenData;

    //         //         shop.open(shopData.id);
    //         //         shop.update(shopData);

    //         //         break;
    //         //     }

    //         //     case Opcodes.Store.Buy:
    //         //         break;

    //         //     case Opcodes.Store.Sell:
    //         //         break;

    //         //     case Opcodes.Store.Select: {
    //         //         let data = info as ShopSelectData;

    //         //         if (shop.isShopOpen(data.id)) shop.move(data);

    //         //         break;
    //         //     }

    //         //     case Opcodes.Store.Remove: {
    //         //         let { id, index } = info as ShopRemoveData;

    //         //         if (shop.isShopOpen(id)) shop.moveBack(index);

    //         //         break;
    //         //     }

    //         //     case Opcodes.Store.Refresh: {
    //         //         let data = info as ShopRefreshData;

    //         //         if (shop.isShopOpen(data.id)) shop.update(data);

    //         //         break;
    //         //     }
    //         // }
    //     });

    //     this.messages.onMap((opcode: Opcodes.Map, info: string) => {
    //         let bufferData = window
    //                 .atob(info)
    //                 // eslint-disable-next-line unicorn/prefer-spread
    //                 .split('')
    //                 // eslint-disable-next-line unicorn/prefer-code-point
    //                 .map((char) => char.charCodeAt(0)),
    //             inflatedString = inflate(new Uint8Array(bufferData), { to: 'string' }),
    //             reigon = JSON.parse(inflatedString);

    //         switch (opcode) {
    //             case Opcodes.Map.Render:
    //                 this.map.loadRegions(reigon);

    //                 break;
    //         }

    //         this.renderer.forceRendering = true;
    //         this.renderer.updateAnimatedTiles();
    //     });

    //     this.messages.onOverlay((opcode, info) => {
    //         console.log(info);

    //         switch (opcode) {
    //             case Opcodes.Overlay.Set: {
    //                 let { image, colour } = info as OverlaySetData;

    //                 this.overlays.update(image);

    //                 if (!this.renderer.transitioning) this.renderer.updateDarkMask(colour);
    //                 else this.queueColour = colour;

    //                 break;
    //             }

    //             case Opcodes.Overlay.Remove:
    //                 this.renderer.removeAllLights();
    //                 this.overlays.update();

    //                 break;

    //             case Opcodes.Overlay.Lamp: {
    //                 let { x, y, distance, diffuse, objects } = info as OverlayLampData;

    //                 this.renderer.addLight(
    //                     x,
    //                     y,
    //                     distance!,
    //                     diffuse!,
    //                     'rgba(0,0,0,0.4)',
    //                     true,
    //                     objects!
    //                 );

    //                 break;
    //             }

    //             case Opcodes.Overlay.RemoveLamps:
    //                 this.renderer.removeAllLights();

    //                 break;

    //             case Opcodes.Overlay.Darkness: {
    //                 let { colour } = info as OverlayDarknessData;

    //                 this.renderer.updateDarkMask(colour);

    //                 break;
    //             }
    //         }
    //     });

    //     this.messages.onCamera((opcode) => {
    //         // if (this.game.player.x === 0 || this.game.player.y === 0) {
    //         //     this.socket.send(Packets.Camera);
    //         //     return;
    //         // }
    //         // if (!this.camera.isCentered()) return;
    //         // this.renderer.camera.forceCentre(this.game.player);
    //         // this.renderer.forceRendering = true;
    //         // switch (opcode) {
    //         //     case Opcodes.Camera.LockX:
    //         //         this.renderer.camera.lockX = true;
    //         //         break;
    //         //     case Opcodes.Camera.LockY:
    //         //         this.renderer.camera.lockY = true;
    //         //         break;
    //         //     case Opcodes.Camera.FreeFlow:
    //         //         this.renderer.removeNonRelativeLights();
    //         //         this.renderer.camera.lockX = false;
    //         //         this.renderer.camera.lockY = false;
    //         //         break;
    //         //     case Opcodes.Camera.Player: {
    //         //         let middle = this.renderer.getMiddle();
    //         //         this.renderer.removeAllLights();
    //         //         this.renderer.addLight(middle.x, middle.y, 160, 0.8, 'rgba(0,0,0,0.3)', false);
    //         //         break;
    //         //     }
    //         // }
    //     });

    //     this.messages.onBubble((info) => {
    //         if (!info.text) {
    //             this.bubble.clear(info.id);
    //             return;
    //         }

    //         this.bubble.create(info.id, info.text, info.duration, info.info);

    //         this.bubble.setTo(info.id, info.info.x, info.info);
    //     });

    //     this.messages.onProfession((opcode, info) => {
    //         switch (opcode) {
    //             case Opcodes.Profession.Batch: {
    //                 let { data } = info as ProfessionBatchData;

    //                 this.menu.getProfessionPage().loadProfessions(data);

    //                 break;
    //             }

    //             case Opcodes.Profession.Update: {
    //                 let data = info as ProfessionUpdateData;

    //                 this.menu.getProfessionPage().sync(data);

    //                 break;
    //             }
    //         }
    //     });
    // }
}
