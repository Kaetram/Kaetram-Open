import _ from 'lodash';

import App from '../app';
import AudioController from '../controllers/audio';
import BubbleController from '../controllers/bubble';
import EntitiesController, { AnyEntity } from '../controllers/entities';
import InfoController from '../controllers/info';
import InputController from '../controllers/input';
import MenuController from '../controllers/menu';
import PointerController from '../controllers/pointer';
import Character from '../entity/character/character';
import Equipment from '../entity/character/player/equipment/equipment';
import Player, { PartialPlayerData } from '../entity/character/player/player';
import Game from '../game';
import log from '../lib/log';
import Map from '../map/map';
import Slot from '../menu/container/slot';
import Inventory from '../menu/inventory';
import Overlay from '../renderer/overlay';
import Renderer from '../renderer/renderer';
import * as Detect from '../utils/detect';
import Modules from '../utils/modules';
import Storage from '../utils/storage';
import TeamWar from './impl/teamwar';
import Messages from './messages';
import Packets from './packets';
import Socket from './socket';

/**
 * TODO: Types to be done when common server and client types are made.
 */

export default class Connection {
    game: Game;
    app: App;
    audio: AudioController;
    messages: Messages;
    storage: Storage;
    socket: Socket;
    input: InputController;
    menu: MenuController;
    entities: EntitiesController;
    map: Map;
    overlays: Overlay;
    renderer: Renderer;
    bubble: BubbleController;
    info: InfoController;
    pointer: PointerController;
    inventory: Inventory;
    teamWar: TeamWar;
    population: number;
    queueColour: string[];
    time: number;

    constructor(game: Game) {
        this.game = game;
        this.app = game.app;
        this.audio = game.audio;
        this.messages = game.messages;
        this.storage = game.storage;
        this.socket = game.socket;
        this.input = game.input;
        this.menu = game.menu;
        this.entities = game.entities;
        this.map = game.map;
        this.overlays = game.overlays;
        this.renderer = game.renderer;
        this.bubble = game.bubble;
        this.info = game.info;
        this.pointer = game.pointer;
        this.inventory = game.inventory;

        this.teamWar = new TeamWar();

        this.load();
    }

    load(): void {
        this.messages.onHandshake((data: Partial<Game>) => {
            this.game.id = data.id;
            this.game.development = data.development;

            this.game.ready = true;

            if (!this.game.player) this.game.createPlayer();

            if (!this.map) this.game.loadMap();

            this.app.updateLoader('Logging in');

            if (this.app.isRegistering()) {
                const registerInfo = this.app.registerFields,
                    username = registerInfo[0].val(),
                    password = registerInfo[1].val(),
                    email = registerInfo[3].val();

                this.socket.send(Packets.Intro, [
                    Packets.IntroOpcode.Register,
                    username,
                    password,
                    email
                ]);
            } else if (this.app.isGuest()) {
                this.socket.send(Packets.Intro, [Packets.IntroOpcode.Guest, 'n', 'n', 'n']);
            } else {
                const loginInfo = this.app.loginFields,
                    name = loginInfo[0].val() as string,
                    pass = loginInfo[1].val() as string;

                this.socket.send(Packets.Intro, [Packets.IntroOpcode.Login, name, pass]);

                if (this.game.hasRemember()) {
                    this.storage.data.player.username = name;
                    this.storage.data.player.password = pass;
                } else {
                    this.storage.data.player.username = '';
                    this.storage.data.player.password = '';
                }

                this.storage.save();
            }
        });

        this.messages.onWelcome((data: PartialPlayerData) => {
            this.menu.loadHeader();

            this.game.player.load(data);

            this.game.start();
            this.game.postLoad();
        });

        this.messages.onEquipment((opcode, info: any) => {
            switch (opcode) {
                case Packets.EquipmentOpcode.Batch:
                    _.each(info, (data: Equipment) => {
                        this.game.player.setEquipment(
                            data.type,
                            data.name,
                            data.string,
                            data.count,
                            data.ability,
                            data.abilityLevel,
                            data.power
                        );
                    });

                    this.menu.loadProfile();

                    break;

                case Packets.EquipmentOpcode.Equip: {
                    const {
                        type,
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    } = info as Equipment;

                    this.game.player.setEquipment(
                        type,
                        name,
                        string,
                        count,
                        ability,
                        abilityLevel,
                        power
                    );

                    this.menu.profile.update();

                    break;
                }

                case Packets.EquipmentOpcode.Unequip: {
                    const type = info.shift();

                    this.game.player.unequip(type);

                    if (type === 'armour')
                        this.game.player.setSprite(
                            this.game.getSprite(this.game.player.getSpriteName())
                        );

                    this.menu.profile.update();

                    break;
                }
            }
        });

        this.messages.onSpawn((data: AnyEntity[]) => {
            this.entities.create(data.shift());
        });

        this.messages.onEntityList((data: string[]) => {
            const ids = _.map(this.entities.getAll(), 'id'),
                known = _.intersection(ids, data),
                newIds = _.difference(data, known);

            this.entities.decrepit = _.reject(this.entities.getAll(), (entity) => {
                return _.includes(known, entity.id) || entity.id === this.game.player.id;
            });

            this.entities.clean(newIds);

            this.socket.send(Packets.Who, newIds);
        });

        this.messages.onSync((data: Player) => {
            const entity = this.entities.get(data.id) as Player;

            if (!entity || entity.type !== 'player') return;

            if (data.hitPoints) {
                entity.setHitPoints(data.hitPoints);
                entity.setMaxHitPoints(data.maxHitPoints);
            }

            if (data.mana) {
                entity.mana = data.mana;
                entity.maxMana = data.maxMana;
            }

            if (data.experience) {
                entity.experience = data.experience;
                entity.level = data.level;
            }

            if (data.armour) entity.setSprite(this.game.getSprite(data.armour.name));

            if (data.weapon)
                entity.setEquipment(
                    data.weapon.type,
                    data.weapon.name,
                    data.weapon.string,
                    data.weapon.count,
                    data.weapon.ability,
                    data.weapon.abilityLevel,
                    data.weapon.power
                );

            if (data.attackRange) entity.attackRange = data.attackRange;

            if (data.poison) entity.setPoison(data.poison);

            if (data.movementSpeed) entity.movementSpeed = data.movementSpeed;

            if (data.orientation !== undefined) entity.orientation = data.orientation;

            this.menu.profile.update();
        });

        this.messages.onMovement((opcode, info: any) => {
            switch (opcode) {
                case Packets.MovementOpcode.Move: {
                    const entity = this.entities.get(info.id) as Character;

                    if (!entity) return;

                    if (info.forced) entity.stop(true);

                    entity.go(info.x, info.y);

                    break;
                }

                case Packets.MovementOpcode.Follow: {
                    const follower = this.entities.get(info.attackerId) as Character,
                        followee = this.entities.get(info.targetId) as Character;

                    if (!followee || !follower) return;

                    follower.follow(followee);

                    break;
                }

                case Packets.MovementOpcode.Stop: {
                    const sEntity = this.entities.get(info.id) as Character,
                        force = info.force;

                    if (!sEntity) return;

                    sEntity.stop(force);

                    break;
                }
                case Packets.MovementOpcode.Freeze:
                case Packets.MovementOpcode.Stunned: {
                    const pEntity = this.entities.get(info.id) as Character;

                    if (!pEntity) return;

                    if (info.state) pEntity.stop(false);

                    if (opcode === Packets.MovementOpcode.Stunned) pEntity.stunned = info.state;
                    else if (opcode === Packets.MovementOpcode.Freeze) pEntity.frozen = info.state;

                    break;
                }

                case Packets.MovementOpcode.Orientate: {
                    const player = info.shift(),
                        orientation = info.shift(),
                        entity = this.entities.get(player) as Character;

                    // entity.stop();
                    entity.performAction(orientation, Modules.Actions.Orientate);

                    break;
                }
            }
        });

        this.messages.onTeleport((info: any) => {
            const entity = this.entities.get(info.id) as Player,
                isPlayer = info.id === this.game.player.id;

            if (!entity) return;

            entity.stop(true);
            entity.frozen = true;

            if (isPlayer) this.bubble.clean();
            else this.bubble.destroy(info.id);

            /**
             * Teleporting an entity seems to cause a glitch with the
             * hitbox. Make sure you keep an eye out for this.
             */

            const doTeleport = () => {
                this.entities.unregisterPosition(entity);
                entity.setGridPosition(info.x, info.y);

                if (isPlayer) {
                    this.entities.clearPlayers(this.game.player);
                    this.game.player.clearHealthBar();
                    this.renderer.camera.centreOn(entity);
                    this.renderer.updateAnimatedTiles();
                } else if (entity.type === 'player') {
                    delete this.entities.entities[entity.id];
                    return;
                }

                this.socket.send(Packets.Request, [this.game.player.id]);

                this.entities.registerPosition(entity);
                entity.frozen = false;

                /*this.renderer.transition(15, true, () => {

                    });*/
            };

            if (info.withAnimation) {
                const originalSprite = entity.sprite;

                entity.teleporting = true;

                entity.setSprite(this.game.getSprite('death'));

                entity.animate('death', 240, 1, () => {
                    doTeleport();

                    entity.currentAnimation = null;

                    entity.setSprite(originalSprite);
                    entity.idle();

                    entity.teleporting = false;
                });
            } else doTeleport();
            /*this.renderer.transition(15, false, () => {
                        if (this.queueColour) {
                            this.renderer.updateDarkMask(this.queueColour);
                            this.queueColour = null;
                        }
                    });*/
        });

        this.messages.onDespawn((id: string) => {
            const entity = this.entities.get(id) as Character;

            if (!entity) return;

            switch (entity.type) {
                case 'item':
                    this.entities.removeItem(entity);

                    return;

                case 'chest':
                    entity.setSprite(this.game.getSprite('death'));

                    entity.setAnimation('death', 120, 1, () => {
                        this.entities.unregisterPosition(entity);
                        delete this.entities.entities[entity.id];
                    });

                    return;
            }

            entity.dead = true;

            entity.stop();

            this.bubble.destroy(entity.id);

            if (this.game.player.hasTarget() && this.game.player.target.id === entity.id)
                this.game.player.removeTarget();

            this.entities.grids.removeFromPathingGrid(entity.gridX, entity.gridY);

            if (entity.id !== this.game.player.id && this.game.player.getDistance(entity) < 5)
                this.audio.play(
                    Modules.AudioTypes.SFX,
                    `kill${Math.floor(Math.random() * 2 + 1)}` as 'kill1' | 'kill2'
                );

            entity.hitPoints = 0;

            if (!entity.sprite.hasDeathAnimation) entity.setSprite(this.game.getSprite('death'));

            entity.animate('death', 120, 1, () => {
                this.entities.unregisterPosition(entity);
                delete this.entities.entities[entity.id];
            });
        });

        this.messages.onCombat((opcode, info: any) => {
            const attacker = this.entities.get(info.attackerId) as Character,
                target = this.entities.get(info.targetId) as Character;

            if (!target || !attacker) return;

            switch (opcode) {
                case Packets.CombatOpcode.Initiate:
                    attacker.setTarget(target);

                    target.addAttacker(attacker);

                    if (target.id === this.game.player.id || attacker.id === this.game.player.id)
                        this.socket.send(Packets.Combat, [
                            Packets.CombatOpcode.Initiate,
                            attacker.id,
                            target.id
                        ]);

                    break;

                case Packets.CombatOpcode.Hit: {
                    const hit = info.hitInfo,
                        isPlayer = target.id === this.game.player.id;

                    if (!hit.isAoE && !hit.isPoison) {
                        attacker.lookAt(target);
                        attacker.performAction(attacker.orientation, Modules.Actions.Attack);
                    } else if (hit.hasTerror) target.terror = true;

                    switch (hit.type) {
                        case Modules.Hits.Critical:
                            target.critical = true;

                            break;

                        default:
                            if (attacker.id === this.game.player.id && hit.damage > 0)
                                this.audio.play(
                                    Modules.AudioTypes.SFX,
                                    `hit${Math.floor(Math.random() * 2 + 1)}` as 'hit1' | 'hit2'
                                );

                            break;
                    }

                    this.info.create(hit.type, [hit.damage, isPlayer], target.x, target.y);

                    if (target.hurtSprite) {
                        target.sprite = target.hurtSprite;
                        setTimeout(() => {
                            target.sprite = target.normalSprite;
                        }, 75);
                    }

                    attacker.triggerHealthBar();
                    target.triggerHealthBar();

                    if (isPlayer && hit.damage > 0) this.audio.play(Modules.AudioTypes.SFX, 'hurt');

                    break;
                }

                case Packets.CombatOpcode.Finish:
                    if (target) {
                        target.removeTarget();
                        target.forget();
                    }

                    if (attacker) attacker.removeTarget();

                    break;

                case Packets.CombatOpcode.Sync:
                    if (target.x !== info.x || target.y !== info.y) target.go(info.x, info.y);

                    break;
            }
        });

        this.messages.onAnimation((id: string, info: any) => {
            const character = this.entities.get(id) as Character;

            if (!character) return;

            character.performAction(character.orientation, info.action);
        });

        this.messages.onProjectile((opcode, info: any) => {
            switch (opcode) {
                case Packets.ProjectileOpcode.Create:
                    this.entities.create(info);

                    break;
            }
        });

        this.messages.onPopulation((population) => {
            this.population = population;
        });

        this.messages.onPoints((data: any) => {
            const entity = this.entities.get(data.id) as Player;

            if (!entity) return;

            if (data.hitPoints) {
                entity.setHitPoints(data.hitPoints);

                if (
                    this.game.player.hasTarget() &&
                    this.game.player.target.id === entity.id &&
                    this.input.overlay.updateCallback
                )
                    this.input.overlay.updateCallback(entity.id, data.hitPoints);
            }

            if (data.mana) entity.setMana(data.mana);
        });

        this.messages.onNetwork(() => {
            this.socket.send(Packets.Network, [Packets.NetworkOpcode.Pong]);
        });

        this.messages.onChat((info: any) => {
            if (this.game.isDebug()) log.info(info);

            if (info.withBubble) {
                const entity = this.entities.get(info.id);

                if (entity) {
                    info.name = info.name.charAt(0).toUpperCase() + info.name.substr(1);

                    this.bubble.create(info.id, info.text, info.duration);
                    this.bubble.setTo(entity);

                    this.audio.play(Modules.AudioTypes.SFX, 'npctalk');
                }
            }

            if (info.isGlobal) info.name = `[Global] ${info.name}`;

            this.input.chatHandler.add(info.name, info.text, info.colour);
        });

        this.messages.onCommand((info: any) => {
            /**
             * This is for random miscellaneous commands that require
             * a specific action done by the client as opposed to
             * packet-oriented ones.
             */

            log.info(info);

            switch (info.command) {
                case 'debug':
                    this.renderer.debugging = !this.renderer.debugging;
                    break;

                case 'toggleheal':
                    log.info('llll');
                    this.game.player.healing = true;
                    break;
            }
        });

        this.messages.onInventory((opcode, info: any) => {
            switch (opcode) {
                case Packets.InventoryOpcode.Batch: {
                    const inventorySize = info.shift() as number,
                        data = info.shift() as Equipment[];

                    this.menu.loadInventory(inventorySize, data);

                    break;
                }

                case Packets.InventoryOpcode.Add: {
                    const slot = info as Slot;

                    if (this.menu.bank) this.menu.addInventory(slot);

                    if (this.menu.inventory) this.menu.inventory.add(slot);

                    break;
                }

                case Packets.InventoryOpcode.Remove: {
                    const slot = info as Slot;

                    if (this.menu.bank) this.menu.removeInventory(slot);

                    if (this.menu.inventory) this.menu.inventory.remove(slot);

                    break;
                }
            }
        });

        this.messages.onBank((opcode, info: any) => {
            switch (opcode) {
                case Packets.BankOpcode.Batch: {
                    const bankSize = info.shift() as number,
                        data = info.shift() as Slot[];

                    this.menu.loadBank(bankSize, data);

                    break;
                }

                case Packets.BankOpcode.Add: {
                    const slot = info as Slot;

                    if (!this.menu.bank) return;

                    this.menu.bank.add(info);

                    break;
                }

                case Packets.BankOpcode.Remove: {
                    const slot = info as Slot;

                    this.menu.bank.remove(info);

                    break;
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.messages.onAbility((opcode, info: any) => {});

        this.messages.onQuest((opcode, info: any) => {
            switch (opcode) {
                case Packets.QuestOpcode.AchievementBatch:
                    this.menu.getQuestPage().loadAchievements(info.achievements);

                    break;

                case Packets.QuestOpcode.QuestBatch:
                    this.menu.getQuestPage().loadQuests(info.quests);

                    break;

                case Packets.QuestOpcode.Progress:
                    this.menu.getQuestPage().progress(info);

                    break;

                case Packets.QuestOpcode.Finish:
                    this.menu.getQuestPage().finish(info);

                    break;
            }
        });

        this.messages.onNotification((opcode, info: any) => {
            switch (opcode) {
                case Packets.NotificationOpcode.Ok:
                    this.menu.displayNotify(info.message);

                    break;

                case Packets.NotificationOpcode.YesNo:
                    this.menu.displayConfirm(info.message);

                    break;

                case Packets.NotificationOpcode.Text:
                    this.input.chatHandler.add('WORLD', info.message, info.colour);

                    break;

                case Packets.NotificationOpcode.Popup:
                    this.menu.showNotification(info.title, info.message, info.colour);

                    break;
            }
        });

        this.messages.onBlink((instance) => {
            const item = this.entities.get(instance);

            if (!item) return;

            item.blink(150);
        });

        this.messages.onHeal((info: any) => {
            const entity = this.entities.get(info.id) as Character;

            if (!entity) return;

            /**
             * Healing just triggers an info to display.
             */

            switch (info.type) {
                case 'health':
                    this.info.create(Modules.Hits.Heal, [info.amount], entity.x, entity.y);

                    this.game.player.healing = true;

                    break;

                case 'mana':
                    this.info.create(Modules.Hits.Mana, [info.amount], entity.x, entity.y);

                    break;
            }

            entity.triggerHealthBar();
        });

        this.messages.onExperience((opcode, info: any) => {
            const entity = this.entities.get(info.id);

            switch (opcode) {
                case Packets.ExperienceOpcode.Combat:
                    if (!entity || entity.type !== 'player') return;

                    /**
                     * We only receive level information about other entities.
                     */
                    if (entity.level !== info.level) {
                        entity.level = info.level;
                        this.info.create(Modules.Hits.LevelUp, null, entity.x, entity.y);
                    }

                    /**
                     * When we receive experience information about our own player
                     * we update the experience bar and create an info.
                     */

                    if (entity.id === this.game.player.id) {
                        if (info.id === this.game.player.id)
                            this.game.player.setExperience(
                                info.experience,
                                info.nextExperience,
                                info.prevExperience
                            );

                        this.info.create(
                            Modules.Hits.Experience,
                            [info.amount],
                            entity.x,
                            entity.y
                        );
                    }

                    this.menu.profile.update();

                    break;

                case Packets.ExperienceOpcode.Profession:
                    if (!entity || entity.type !== 'player') return;

                    if (entity.id === this.game.player.id)
                        this.info.create(
                            Modules.Hits.Profession,
                            [info.amount],
                            entity.x,
                            entity.y
                        );

                    break;
            }
        });

        this.messages.onDeath((id) => {
            const entity = this.entities.get(id);

            if (!entity || id !== this.game.player.id) return;

            this.audio.stop();

            //this.audio.play(Modules.AudioTypes.SFX, 'death');

            this.game.player.dead = true;
            this.game.player.removeTarget();
            this.game.player.orientation = Modules.Orientation.Down;

            this.app.body.addClass('death');
        });

        this.messages.onAudio((newSong) => {
            this.audio.newSong = newSong;

            if (!this.audio.newSong || Detect.isMobile()) return;

            this.audio.update();
        });

        this.messages.onNPC((opcode, info: any) => {
            switch (opcode) {
                case Packets.NPCOpcode.Talk: {
                    const entity = this.entities.get(info.id),
                        message = info.text,
                        isNPC = !info.nonNPC;

                    if (!entity) return;

                    let sound: 'npc' | 'npc-end';

                    if (isNPC) {
                        if (!message) {
                            sound = 'npc-end';
                            this.bubble.destroy(info.id);
                        } else {
                            sound = 'npc';

                            this.bubble.create(info.id, message);

                            this.bubble.setTo(entity);

                            if (this.renderer.mobile && this.renderer.autoCentre)
                                this.renderer.camera.centreOn(this.game.player);
                        }
                    } else {
                        this.bubble.create(info.id, message, this.time);
                        this.bubble.setTo(entity);
                    }

                    this.audio.play(Modules.AudioTypes.SFX, sound);

                    this.game.player.disableAction = true;

                    break;
                }

                case Packets.NPCOpcode.Bank:
                    this.menu.bank.display();
                    break;

                case Packets.NPCOpcode.Enchant:
                    this.menu.enchant.display();
                    break;

                case Packets.NPCOpcode.Countdown: {
                    const cEntity = this.entities.get(info.id),
                        countdown = info.countdown;

                    if (cEntity) cEntity.setCountdown(countdown);

                    break;
                }
            }
        });

        this.messages.onRespawn((id, x, y) => {
            if (id !== this.game.player.id) {
                log.error('Player id mismatch.');
                return;
            }

            this.game.player.setGridPosition(x, y);
            this.entities.registerPosition(this.game.player);
            this.renderer.camera.centreOn(this.game.player);

            this.game.player.currentAnimation = null;
            this.game.player.setSprite(this.game.getSprite(this.game.player.getSpriteName()));
            this.game.player.idle();

            this.entities.addEntity(this.game.player);

            this.game.player.dead = false;
        });

        this.messages.onEnchant((opcode, info: any) => {
            const type = info.type,
                index = info.index;

            switch (opcode) {
                case Packets.EnchantOpcode.Select:
                    this.menu.enchant.add(type, index);

                    break;

                case Packets.EnchantOpcode.Remove:
                    this.menu.enchant.moveBack(type, index);

                    break;
            }
        });

        this.messages.onGuild((opcode, info: any) => {
            switch (opcode) {
                case Packets.GuildOpcode.Create:
                    break;

                case Packets.GuildOpcode.Join:
                    break;
            }
        });

        this.messages.onPointer((opcode, info: any) => {
            switch (opcode) {
                case Packets.PointerOpcode.NPC: {
                    const entity = this.entities.get(info.id);

                    if (!entity) return;

                    this.pointer.create(entity.id, Modules.Pointers.Entity);
                    this.pointer.setToEntity(entity);

                    break;
                }

                case Packets.PointerOpcode.Location:
                    this.pointer.create(info.id, Modules.Pointers.Position);
                    this.pointer.setToPosition(info.id, info.x * 16, info.y * 16);

                    break;

                case Packets.PointerOpcode.Relative:
                    this.pointer.create(info.id, Modules.Pointers.Relative);
                    this.pointer.setRelative(info.id, info.x, info.y);

                    break;

                case Packets.PointerOpcode.Remove:
                    this.pointer.clean();

                    break;

                case Packets.PointerOpcode.Button:
                    this.pointer.create(info.id, Modules.Pointers.Button, info.button);

                    break;
            }
        });

        this.messages.onPVP((id, pvp) => {
            if (this.game.player.id === id) this.game.pvp = pvp;
            else {
                const entity = this.entities.get(id);

                if (entity) entity.pvp = pvp;
            }
        });

        this.messages.onShop((opcode, info: any) => {
            const shopData = info.shopData;

            switch (opcode) {
                case Packets.ShopOpcode.Open:
                    this.menu.shop.open(shopData.id);
                    this.menu.shop.update(shopData);

                    break;

                case Packets.ShopOpcode.Buy:
                    break;

                case Packets.ShopOpcode.Sell:
                    break;

                case Packets.ShopOpcode.Select:
                    if (this.menu.shop.isShopOpen(info.id)) this.menu.shop.move(info);

                    break;

                case Packets.ShopOpcode.Remove:
                    if (this.menu.shop.isShopOpen(info.id)) this.menu.shop.moveBack(info.index);

                    break;

                case Packets.ShopOpcode.Refresh:
                    if (this.menu.shop.isShopOpen(info.id)) this.menu.shop.update(info);

                    break;
            }
        });

        this.messages.onMinigame((opcode, info: any) => {
            switch (opcode) {
                case Packets.MinigameOpcode.TeamWar:
                    this.teamWar.handle(info);

                    break;
            }
        });

        this.messages.onRegion((opcode, info: any) => {
            switch (opcode) {
                case Packets.RegionOpcode.Render:
                    this.map.synchronize(info);

                    break;

                case Packets.RegionOpcode.Modify:
                    this.map.data[info.index] = info.data;

                    break;

                case Packets.RegionOpcode.Update: {
                    const entity = this.entities.get(info.id);

                    if (!entity || entity.id === this.game.player.id) return;

                    this.entities.removeEntity(entity);

                    break;
                }
            }

            this.map.updateCollisions();
            this.entities.grids.resetPathingGrid();

            this.renderer.forceRendering = true;
            this.renderer.updateAnimatedTiles();
        });

        this.messages.onOverlay((opcode, info: any) => {
            switch (opcode) {
                case Packets.OverlayOpcode.Set:
                    this.overlays.updateOverlay(info.image);

                    if (!this.renderer.transitioning) this.renderer.updateDarkMask(info.colour);
                    else this.queueColour = info.colour;

                    break;

                case Packets.OverlayOpcode.Remove:
                    this.renderer.removeAllLights();
                    this.overlays.currentOverlay = null;

                    break;

                case Packets.OverlayOpcode.Lamp:
                    this.renderer.addLight(
                        info.x,
                        info.y,
                        info.distance,
                        info.diffuse,
                        'rgba(0,0,0,0.4)',
                        true,
                        info.objects
                    );

                    break;

                case Packets.OverlayOpcode.RemoveLamps:
                    this.renderer.removeAllLights();

                    break;

                case Packets.OverlayOpcode.Darkness:
                    this.renderer.updateDarkMask(info.colour);

                    break;
            }
        });

        this.messages.onCamera((opcode, info: any) => {
            if (this.game.player.x === 0 || this.game.player.y === 0) {
                this.socket.send(Packets.Camera);
                return;
            }

            if (!this.renderer.camera.centered) return;

            this.renderer.camera.forceCentre(this.game.player);
            this.renderer.forceRendering = true;

            switch (opcode) {
                case Packets.CameraOpcode.LockX:
                    this.renderer.camera.lockX = true;
                    break;

                case Packets.CameraOpcode.LockY:
                    this.renderer.camera.lockY = true;
                    break;

                case Packets.CameraOpcode.FreeFlow:
                    this.renderer.removeNonRelativeLights();

                    this.renderer.camera.lockX = false;
                    this.renderer.camera.lockY = false;
                    break;

                case Packets.CameraOpcode.Player: {
                    const middle = this.renderer.getMiddle();

                    this.renderer.removeAllLights();
                    this.renderer.addLight(middle.x, middle.y, 160, 0.8, 'rgba(0,0,0,0.3)', false);

                    break;
                }
            }
        });

        this.messages.onBubble((info: any) => {
            if (!info.text) {
                this.bubble.destroy(info.id);
                return;
            }

            this.bubble.create(info.id, info.text, info.duration, info.isObject, info.info);

            this.bubble.setTo(info.info);
        });

        this.messages.onProfession((opcode, info: any) => {
            switch (opcode) {
                case Packets.ProfessionOpcode.Batch:
                    this.menu.getProfessionPage().load(info.data);

                    break;

                case Packets.ProfessionOpcode.Update:
                    this.menu.getProfessionPage().sync(info);

                    break;
            }
        });
    }
}
