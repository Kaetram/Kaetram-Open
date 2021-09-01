import _ from 'lodash';
import { inflate } from 'pako';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import log from '../lib/log';
import * as Detect from '../utils/detect';
import TeamWar from './impl/teamwar';

import type {
    CombatHitData,
    CombatSyncData,
    ContainerAddData,
    ContainerBatchData,
    ContainerRemoveData,
    EquipmentBatchData,
    EquipmentEquipData,
    EquipmentUnequipData,
    ExperienceCombatData,
    MovementFollowData,
    MovementMoveData,
    MovementOrientateData,
    MovementStateData,
    MovementStopData,
    NPCCountdownData,
    NPCTalkData,
    OverlayDarknessData,
    OverlayLampData,
    OverlaySetData,
    PointerButtonData,
    PointerLocationData,
    PointerRelativeData,
    ProfessionBatchData,
    ProfessionUpdateData,
    QuestAchievementBatchData,
    QuestBatchData,
    QuestFinishData,
    QuestProgressData,
    ShopOpenData,
    ShopRefreshData,
    ShopRemoveData,
    ShopSelectData
} from '@kaetram/common/types/messages';
import type { AnyEntity } from '../controllers/entities';
import type Character from '../entity/character/character';
import type Player from '../entity/character/player/player';
import type Game from '../game';
import type Slot from '../menu/container/slot';

export default class Connection {
    private app;
    private audio;
    private messages;
    private storage;
    private socket;
    private input;
    private menu;
    private entities;
    private map;
    private overlays;
    private renderer;
    private bubble;
    private info;
    private pointer;
    // private inventory = this.game.inventory;

    private teamWar = new TeamWar();

    private population!: number;
    private queueColour!: string | null;
    private time!: number;

    public constructor(private game: Game) {
        let {
            app,
            audio,
            messages,
            storage,
            socket,
            input,
            menu,
            entities,
            map,
            overlays,
            renderer,
            bubble,
            info,
            pointer
        } = game;

        this.app = app;
        this.audio = audio;
        this.messages = messages;
        this.storage = storage;
        this.socket = socket;
        this.input = input;
        this.menu = menu;
        this.entities = entities;
        this.map = map;
        this.overlays = overlays;
        this.renderer = renderer;
        this.bubble = bubble;
        this.info = info;
        this.pointer = pointer;

        this.load();
    }

    private load(): void {
        this.messages.onHandshake((data) => {
            this.game.id = data.id;

            this.game.ready = true;

            if (!this.game.player) this.game.createPlayer();

            if (!this.map) this.game.loadMap();

            this.app.updateLoader('Logging in');

            if (this.app.isRegistering()) {
                let registerInfo = this.app.registerFields,
                    username = registerInfo[0].val(),
                    password = registerInfo[1].val(),
                    email = registerInfo[3].val();

                this.socket.send(Packets.Intro, [
                    Opcodes.Intro.Register,
                    username,
                    password,
                    email
                ]);
            } else if (this.app.isGuest())
                this.socket.send(Packets.Intro, [Opcodes.Intro.Guest, 'n', 'n', 'n']);
            else {
                let loginInfo = this.app.loginFields,
                    name = loginInfo[0].val() as string,
                    pass = loginInfo[1].val() as string;

                this.socket.send(Packets.Intro, [Opcodes.Intro.Login, name, pass]);

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

        this.messages.onWelcome((data) => {
            this.menu.loadHeader();

            this.game.player.load(data);

            this.game.start();
            this.game.postLoad();
        });

        this.messages.onEquipment((opcode, info) => {
            switch (opcode) {
                case Opcodes.Equipment.Batch: {
                    _.each(info as EquipmentBatchData, (data) => {
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
                }

                case Opcodes.Equipment.Equip: {
                    let { type, name, string, count, ability, abilityLevel, power } =
                        info as EquipmentEquipData;

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

                case Opcodes.Equipment.Unequip: {
                    let type = info as EquipmentUnequipData;

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

        this.messages.onSpawn((data) => this.entities.create(data as AnyEntity));

        this.messages.onEntityList((data) => {
            let ids = _.map(this.entities.getAll(), 'id'),
                known = _.intersection(ids, data),
                newIds = _.difference(data, known);

            this.entities.decrepit = _.reject(
                this.entities.getAll(),
                (entity) => _.includes(known, entity.id) || entity.id === this.game.player.id
            );

            this.entities.clean();

            this.socket.send(Packets.Who, newIds);
        });

        this.messages.onSync((data) => {
            let entity = this.entities.get<Player>(data.id);

            if (!entity || entity.type !== 'player') return;

            if (data.hitPoints) {
                entity.setHitPoints(data.hitPoints);
                entity.setMaxHitPoints(data.maxHitPoints!);
            }

            if (data.mana) {
                entity.mana = data.mana;
                entity.maxMana = data.maxMana!;
            }

            if (data.experience!) {
                entity.experience = data.experience!;
                entity.level = data.level!;
            }

            if (data.armour) entity.setSprite(this.game.getSprite(data.armour));

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

        this.messages.onMovement((opcode, info) => {
            switch (opcode) {
                case Opcodes.Movement.Move: {
                    let data = info as MovementMoveData,
                        entity = this.entities.get<Character>(data.id);

                    if (!entity) return;

                    if (data.forced) entity.stop(true);

                    entity.go(data.x, data.y);

                    break;
                }

                case Opcodes.Movement.Follow: {
                    let data = info as MovementFollowData,
                        follower = this.entities.get<Character>(data.attackerId),
                        followee = this.entities.get<Character>(data.targetId);

                    if (!followee || !follower) return;

                    follower.follow(followee);

                    break;
                }

                case Opcodes.Movement.Stop: {
                    let data = info as MovementStopData,
                        sEntity = this.entities.get<Character>(data.instance),
                        { force } = data;

                    if (!sEntity) return;

                    sEntity.stop(force);

                    break;
                }
                case Opcodes.Movement.Freeze:
                case Opcodes.Movement.Stunned: {
                    let data = info as MovementStateData,
                        pEntity = this.entities.get<Character>(data.id);

                    if (!pEntity) return;

                    if (data.state) pEntity.stop(false);

                    if (opcode === Opcodes.Movement.Stunned) pEntity.stunned = data.state;
                    else if (opcode === Opcodes.Movement.Freeze) pEntity.frozen = data.state;

                    break;
                }

                case Opcodes.Movement.Orientate: {
                    let [player, orientation] = info as MovementOrientateData,
                        entity = this.entities.get<Character>(player);

                    // entity.stop();
                    entity.performAction(orientation, Modules.Actions.Orientate);

                    break;
                }
            }
        });

        this.messages.onTeleport((info) => {
            let entity = this.entities.get<Player>(info.id),
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

            let doTeleport = () => {
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
                let originalSprite = entity.sprite;

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

            // this.renderer.transition(15, false, () => {
            //     if (this.queueColour) {
            //         this.renderer.updateDarkMask(this.queueColour);
            //         this.queueColour = null;
            //     }
            // });
        });

        this.messages.onDespawn((id) => {
            let entity = this.entities.get<Character>(id);

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

            if (this.game.player.target && this.game.player.target.id === entity.id)
                this.game.player.removeTarget();

            this.entities.grids.removeFromPathingGrid(entity.gridX, entity.gridY);

            if (entity.id !== this.game.player.id && this.game.player.getDistance(entity) < 5)
                this.audio.play(
                    Modules.AudioTypes.SFX,
                    `kill${Math.floor(Math.random() * 2 + 1) as 1 | 2}` as const
                );

            entity.hitPoints = 0;

            if (!entity.sprite.hasDeathAnimation) entity.setSprite(this.game.getSprite('death'));

            entity.animate('death', 120, 1, () => {
                this.entities.unregisterPosition(entity);
                delete this.entities.entities[entity.id];
            });
        });

        this.messages.onCombat((opcode, info) => {
            let attacker = this.entities.get<Character>(info.attackerId!),
                target = this.entities.get<Character>(info.targetId!);

            if (!target || !attacker) return;

            switch (opcode) {
                case Opcodes.Combat.Initiate:
                    attacker.setTarget(target);

                    target.addAttacker(attacker);

                    if (target.id === this.game.player.id || attacker.id === this.game.player.id)
                        this.socket.send(Packets.Combat, [
                            Opcodes.Combat.Initiate,
                            attacker.id,
                            target.id
                        ]);

                    break;

                case Opcodes.Combat.Hit: {
                    let data = info as CombatHitData,
                        hit = data.hitInfo!,
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
                        window.setTimeout(() => {
                            target.sprite = target.normalSprite;
                        }, 75);
                    }

                    attacker.triggerHealthBar();
                    target.triggerHealthBar();

                    if (isPlayer && hit.damage > 0) this.audio.play(Modules.AudioTypes.SFX, 'hurt');

                    break;
                }

                case Opcodes.Combat.Finish:
                    if (target) {
                        target.removeTarget();
                        target.forget();
                    }

                    attacker?.removeTarget();

                    break;

                case Opcodes.Combat.Sync: {
                    let data = info as CombatSyncData;
                    if (target.x !== data.x || target.y !== data.y) target.go(data.x, data.y);

                    break;
                }
            }
        });

        this.messages.onAnimation((id, info) => {
            let character = this.entities.get<Character>(id);

            if (!character) return;

            character.performAction(character.orientation, info.action);
        });

        this.messages.onProjectile((opcode, info) => {
            switch (opcode) {
                case Opcodes.Projectile.Create:
                    this.entities.create(info as AnyEntity);

                    break;
            }
        });

        this.messages.onPopulation((population) => {
            this.population = population;
        });

        this.messages.onPoints((data) => {
            let entity = this.entities.get<Player>(data.id);

            if (!entity) return;

            if (data.hitPoints) {
                entity.setHitPoints(data.hitPoints);

                if (
                    this.game.player.target &&
                    this.game.player.target.id === entity.id &&
                    this.input.overlay.updateCallback
                )
                    this.input.overlay.updateCallback(entity.id, data.hitPoints);
            }

            if (data.mana) entity.setMana(data.mana);
        });

        this.messages.onNetwork(() => this.socket.send(Packets.Network, [Opcodes.Network.Pong]));

        this.messages.onChat((info) => {
            log.debug(info);

            if (info.withBubble) {
                let entity = this.entities.get(info.id!);

                if (entity) {
                    info.name = info.name.charAt(0).toUpperCase() + info.name.slice(1);

                    this.bubble.create(info.id!, info.text, info.duration);
                    this.bubble.setTo(entity);

                    this.audio.play(Modules.AudioTypes.SFX, 'npctalk');
                }
            }

            if (info.isGlobal) info.name = `[Global] ${info.name}`;

            this.input.chatHandler.add(info.name, info.text, info.colour);
        });

        this.messages.onCommand((info) => {
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

        this.messages.onInventory((opcode, info) => {
            switch (opcode) {
                case Opcodes.Inventory.Batch: {
                    let [inventorySize, data] = info as ContainerBatchData;

                    this.menu.loadInventory(inventorySize, data);

                    break;
                }

                case Opcodes.Inventory.Add: {
                    let slot = info as Slot;

                    if (this.menu.bank) this.menu.addInventory(slot);

                    this.menu.inventory?.add(slot);

                    break;
                }

                case Opcodes.Inventory.Remove: {
                    let slot = info as Slot;

                    if (this.menu.bank) this.menu.removeInventory(slot);

                    this.menu.inventory?.remove(slot);

                    break;
                }
            }
        });

        this.messages.onBank((opcode, info) => {
            switch (opcode) {
                case Opcodes.Bank.Batch: {
                    let [bankSize, data] = info as ContainerBatchData;

                    this.menu.loadBank(bankSize, data);

                    break;
                }

                case Opcodes.Bank.Add: {
                    if (!this.menu.bank) return;

                    this.menu.bank.add(info as ContainerAddData);

                    break;
                }

                case Opcodes.Bank.Remove: {
                    this.menu.bank.remove(info as ContainerRemoveData);

                    break;
                }
            }
        });

        // this.messages.onAbility((opcode, info) => {});

        this.messages.onQuest((opcode, info) => {
            switch (opcode) {
                case Opcodes.Quest.AchievementBatch: {
                    let data = info as QuestAchievementBatchData;

                    this.menu.getQuestPage().loadAchievements(data.achievements);

                    break;
                }

                case Opcodes.Quest.QuestBatch: {
                    let data = info as QuestBatchData;

                    this.menu.getQuestPage().loadQuests(data.quests);

                    break;
                }

                case Opcodes.Quest.Progress:
                    this.menu.getQuestPage().progress(info as QuestProgressData);

                    break;

                case Opcodes.Quest.Finish:
                    this.menu.getQuestPage().finish(info as QuestFinishData);

                    break;
            }
        });

        this.messages.onNotification((opcode, info) => {
            switch (opcode) {
                case Opcodes.Notification.Ok:
                    this.menu.displayNotify(info.message);

                    break;

                case Opcodes.Notification.YesNo:
                    this.menu.displayConfirm(info.message);

                    break;

                case Opcodes.Notification.Text:
                    this.input.chatHandler.add('WORLD', info.message, info.colour);

                    break;

                case Opcodes.Notification.Popup:
                    this.menu.showNotification(info.title!, info.message, info.colour!);

                    break;
            }
        });

        this.messages.onBlink((instance) => {
            let item = this.entities.get(instance);

            if (!item) return;

            item.blink(150);
        });

        this.messages.onHeal((info) => {
            let entity = this.entities.get<Character>(info.id);

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

        this.messages.onExperience((opcode, info) => {
            let entity = this.entities.get(info.id);

            switch (opcode) {
                case Opcodes.Experience.Combat: {
                    if (!entity || entity.type !== 'player') return;

                    let data = info as ExperienceCombatData;

                    /**
                     * We only receive level information about other entities.
                     */
                    if (entity.level !== data.level) {
                        entity.level = data.level;
                        this.info.create(Modules.Hits.LevelUp, null, entity.x, entity.y);
                    }

                    /**
                     * When we receive experience information about our own player
                     * we update the experience bar and create an info.
                     */

                    if (entity.id === this.game.player.id) {
                        if (info.id === this.game.player.id)
                            this.game.player.setExperience(
                                data.experience,
                                data.nextExperience!,
                                data.prevExperience
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
                }

                case Opcodes.Experience.Profession:
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
            let entity = this.entities.get(id);

            if (!entity || id !== this.game.player.id) return;

            this.audio.stop();

            // this.audio.play(Modules.AudioTypes.SFX, 'death');

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

        this.messages.onNPC((opcode, info) => {
            switch (opcode) {
                case Opcodes.NPC.Talk: {
                    let data = info as NPCTalkData,
                        entity = this.entities.get(data.id!),
                        message = data.text,
                        isNPC = !data.nonNPC;

                    if (!entity) return;

                    let sound!: 'npc' | 'npc-end';

                    if (isNPC)
                        if (!message) {
                            sound = 'npc-end';
                            this.bubble.destroy(data.id!);
                        } else {
                            sound = 'npc';

                            this.bubble.create(data.id!, message);

                            this.bubble.setTo(entity);

                            if (this.renderer.mobile && this.renderer.autoCentre)
                                this.renderer.camera.centreOn(this.game.player);
                        }
                    else {
                        this.bubble.create(data.id!, message!, this.time);
                        this.bubble.setTo(entity);
                    }

                    this.audio.play(Modules.AudioTypes.SFX, sound);

                    this.game.player.disableAction = true;

                    break;
                }

                case Opcodes.NPC.Bank:
                    this.menu.bank.display();
                    break;

                case Opcodes.NPC.Enchant:
                    this.menu.enchant.display();
                    break;

                case Opcodes.NPC.Countdown: {
                    let data = info as NPCCountdownData,
                        cEntity = this.entities.get(data.id),
                        { countdown } = data;

                    cEntity?.setCountdown(countdown);

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

        this.messages.onEnchant((opcode, info) => {
            let { type, index } = info;

            switch (opcode) {
                case Opcodes.Enchant.Select:
                    this.menu.enchant.add(type, index);

                    break;

                case Opcodes.Enchant.Remove:
                    this.menu.enchant.moveBack(type, index);

                    break;
            }
        });

        this.messages.onGuild((opcode) => {
            switch (opcode) {
                case Opcodes.Guild.Create:
                    break;

                case Opcodes.Guild.Join:
                    break;
            }
        });

        this.messages.onPointer((opcode, info) => {
            switch (opcode) {
                case Opcodes.Pointer.NPC: {
                    let entity = this.entities.get(info.id!);

                    if (!entity) return;

                    this.pointer.create(entity.id, Modules.Pointers.Entity);
                    this.pointer.setToEntity(entity);

                    break;
                }

                case Opcodes.Pointer.Location: {
                    let data = info as PointerLocationData;

                    this.pointer.create(data.id, Modules.Pointers.Position);
                    this.pointer.setToPosition(data.id, data.x * 16, data.y * 16);

                    break;
                }

                case Opcodes.Pointer.Relative: {
                    let data = info as PointerRelativeData;

                    this.pointer.create(data.id, Modules.Pointers.Relative);
                    this.pointer.setRelative(data.id, data.x, data.y);

                    break;
                }

                case Opcodes.Pointer.Remove:
                    this.pointer.clean();

                    break;

                case Opcodes.Pointer.Button: {
                    let data = info as PointerButtonData;

                    this.pointer.create(data.id, Modules.Pointers.Button, data.button);

                    break;
                }
            }
        });

        this.messages.onPVP((id, pvp) => {
            if (this.game.player.id === id) this.game.pvp = pvp;
            else {
                let entity = this.entities.get(id);

                if (entity) entity.pvp = pvp;
            }
        });

        this.messages.onShop((opcode, info) => {
            let { shop } = this.menu;

            switch (opcode) {
                case Opcodes.Shop.Open: {
                    let { shopData } = info as ShopOpenData;

                    shop.open(shopData.id);
                    shop.update(shopData);

                    break;
                }

                case Opcodes.Shop.Buy:
                    break;

                case Opcodes.Shop.Sell:
                    break;

                case Opcodes.Shop.Select: {
                    let data = info as ShopSelectData;

                    if (shop.isShopOpen(data.id)) shop.move(data);

                    break;
                }

                case Opcodes.Shop.Remove: {
                    let { id, index } = info as ShopRemoveData;

                    if (shop.isShopOpen(id)) shop.moveBack(index);

                    break;
                }

                case Opcodes.Shop.Refresh: {
                    let data = info as ShopRefreshData;

                    if (shop.isShopOpen(data.id)) shop.update(data);

                    break;
                }
            }
        });

        this.messages.onMinigame((opcode, info) => {
            switch (opcode) {
                case Opcodes.Minigame.TeamWar:
                    this.teamWar.handle(info);

                    break;
            }
        });

        this.messages.onRegion((opcode, bufferSize, info) => {
            let bufferData = window
                    .atob(info)
                    .split('')
                    .map((char) => char.charCodeAt(0)),
                inflatedString = inflate(new Uint8Array(bufferData), { to: 'string' }),
                reigon = JSON.parse(inflatedString);

            switch (opcode) {
                case Opcodes.Region.Render:
                    this.map.synchronize(reigon);

                    break;

                case Opcodes.Region.Modify:
                    this.map.data[reigon.index] = reigon.data;

                    break;

                case Opcodes.Region.Update: {
                    let entity = this.entities.get(reigon.id);

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

        this.messages.onOverlay((opcode, info) => {
            switch (opcode) {
                case Opcodes.Overlay.Set: {
                    let { image, colour } = info as OverlaySetData;

                    this.overlays.updateOverlay(image);

                    if (!this.renderer.transitioning) this.renderer.updateDarkMask(colour);
                    else this.queueColour = colour;

                    break;
                }

                case Opcodes.Overlay.Remove:
                    this.renderer.removeAllLights();
                    this.overlays.currentOverlay = null;

                    break;

                case Opcodes.Overlay.Lamp: {
                    let { x, y, distance, diffuse, objects } = info as OverlayLampData;

                    this.renderer.addLight(
                        x,
                        y,
                        distance!,
                        diffuse!,
                        'rgba(0,0,0,0.4)',
                        true,
                        objects!
                    );

                    break;
                }

                case Opcodes.Overlay.RemoveLamps:
                    this.renderer.removeAllLights();

                    break;

                case Opcodes.Overlay.Darkness: {
                    let { colour } = info as OverlayDarknessData;

                    this.renderer.updateDarkMask(colour);

                    break;
                }
            }
        });

        this.messages.onCamera((opcode) => {
            if (this.game.player.x === 0 || this.game.player.y === 0) {
                this.socket.send(Packets.Camera);
                return;
            }

            if (!this.renderer.camera.centered) return;

            this.renderer.camera.forceCentre(this.game.player);
            this.renderer.forceRendering = true;

            switch (opcode) {
                case Opcodes.Camera.LockX:
                    this.renderer.camera.lockX = true;
                    break;

                case Opcodes.Camera.LockY:
                    this.renderer.camera.lockY = true;
                    break;

                case Opcodes.Camera.FreeFlow:
                    this.renderer.removeNonRelativeLights();

                    this.renderer.camera.lockX = false;
                    this.renderer.camera.lockY = false;
                    break;

                case Opcodes.Camera.Player: {
                    let middle = this.renderer.getMiddle();

                    this.renderer.removeAllLights();
                    this.renderer.addLight(middle.x, middle.y, 160, 0.8, 'rgba(0,0,0,0.3)', false);

                    break;
                }
            }
        });

        this.messages.onBubble((info) => {
            if (!info.text) {
                this.bubble.destroy(info.id);
                return;
            }

            this.bubble.create(info.id, info.text, info.duration, info.isObject, info.info);

            this.bubble.setTo(info.info);
        });

        this.messages.onProfession((opcode, info) => {
            switch (opcode) {
                case Opcodes.Profession.Batch: {
                    let { data } = info as ProfessionBatchData;

                    this.menu.getProfessionPage().loadProfessions(data);

                    break;
                }

                case Opcodes.Profession.Update: {
                    let data = info as ProfessionUpdateData;

                    this.menu.getProfessionPage().sync(data);

                    break;
                }
            }
        });
    }
}
