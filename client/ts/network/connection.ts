/* global log, _ */

import TeamWar from './impl/teamwar';
import Packets from './packets';
import Modules from '../utils/modules';
import Detect from '../utils/detect';
import _ from 'underscore';

export default class Connection {
    game: any;
    app: any;
    audio: any;
    messages: any;
    storage: any;
    socket: any;
    input: any;
    interface: any;
    entities: any;
    map: any;
    overlays: any;
    renderer: any;
    bubble: any;
    info: any;
    pointer: any;
    inventory: any;
    teamWar: TeamWar;
    population: any;
    queueColour: any;
    constructor(game) {
        this.game = game;
        this.app = game.app;
        this.audio = game.audio;
        this.messages = game.messages;
        this.storage = game.storage;
        this.socket = game.socket;
        this.input = game.input;
        this.interface = game.interface;
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

    load() {
        this.messages.onHandshake((data) => {
            this.game.id = data.id;
            this.game.development = data.development;

            this.game.ready = true;

            if (!this.game.player) this.game.createPlayer();

            if (!this.map) this.game.loadMap();

            this.app.updateLoader('Logging in');

            if (this.app.isRegistering()) {
                const registerInfo = this.app.registerFields;
                const username = registerInfo[0].val();
                const password = registerInfo[1].val();
                const email = registerInfo[3].val();

                this.socket.send(Packets.Intro, [
                    Packets.IntroOpcode.Register,
                    username,
                    password,
                    email
                ]);
            } else if (this.app.isGuest()) {
                this.socket.send(Packets.Intro, [
                    Packets.IntroOpcode.Guest,
                    'n',
                    'n',
                    'n'
                ]);
            } else {
                const loginInfo = this.app.loginFields;
                const name = loginInfo[0].val();
                const pass = loginInfo[1].val();

                this.socket.send(Packets.Intro, [
                    Packets.IntroOpcode.Login,
                    name,
                    pass
                ]);

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
            this.interface.loadHeader();

            this.game.player.load(data);

            this.game.start();
            this.game.postLoad();
        });

        this.messages.onEquipment((opcode, info) => {
            switch (opcode) {
                case Packets.EquipmentOpcode.Batch:
                    _.each(info, (data: any) => {
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

                    this.interface.loadProfile();

                    break;

                case Packets.EquipmentOpcode.Equip:
                    this.game.player.setEquipment(
                        info.type,
                        info.name,
                        info.string,
                        info.count,
                        info.ability,
                        info.abilityLevel,
                        info.power
                    );

                    this.interface.profile.update();

                    break;

                case Packets.EquipmentOpcode.Unequip:
                    const type = info.shift();

                    this.game.player.unequip(type);

                    if (type === 'armour')
                        this.game.player.setSprite(
                            this.game.getSprite(
                                this.game.player.getSpriteName()
                            )
                        );

                    this.interface.profile.update();

                    break;
            }
        });

        this.messages.onSpawn((data) => {
            this.entities.create(data.shift());
        });

        this.messages.onEntityList((data) => {
            const ids = _.pluck(this.entities.getAll(), 'id');
            const known = _.intersection(ids, data);
            const newIds = _.difference(data, known);

            this.entities.decrepit = _.reject(
                this.entities.getAll(),
                (entity: any) => {
                    return (
                        _.include(known, entity.id) ||
                        entity.id === this.game.player.id
                    );
                }
            );

            this.entities.clean(newIds);

            this.socket.send(Packets.Who, newIds);
        });

        this.messages.onSync((data) => {
            const entity = this.entities.get(data.id);

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

            entity.attackRange = data.attackRange;
            entity.setPoison(data.poison);

            entity.movementSpeed = data.movementSpeed;

            this.interface.profile.update();
        });

        this.messages.onMovement((opcode, info) => {
            switch (opcode) {
                case Packets.MovementOpcode.Move: {
                    const entity = this.entities.get(info.id);

                    if (!entity) return;

                    if (info.forced) entity.stop(true);

                    entity.go(info.x, info.y);

                    break;
                }
                case Packets.MovementOpcode.Follow:
                    const follower = this.entities.get(info.attackerId);
                    const followee = this.entities.get(info.targetId);

                    if (!followee || !follower) return;

                    follower.follow(followee);

                    break;

                case Packets.MovementOpcode.Stop:
                    const sEntity = this.entities.get(info.id);
                    const force = info.force;

                    if (!sEntity) return;

                    sEntity.stop(force);

                    break;

                case Packets.MovementOpcode.Freeze:
                case Packets.MovementOpcode.Stunned:
                    const pEntity = this.entities.get(info.id);

                    if (!pEntity) return;

                    if (info.state) pEntity.stop(false);

                    if (opcode === Packets.MovementOpcode.Stunned)
                        pEntity.stunned = info.state;
                    else if (opcode === Packets.MovementOpcode.Freeze)
                        pEntity.frozen = info.state;

                    break;

                case Packets.MovementOpcode.Orientate:
                    const player = info.shift();
                    const orientation = info.shift();
                    const entity = this.entities.get(player);

                    // entity.stop();
                    entity.performAction(
                        orientation,
                        Modules.Actions.Orientate
                    );

                    break;
            }
        });

        this.messages.onTeleport((info) => {
            const entity = this.entities.get(info.id);
            const isPlayer = info.id === this.game.player.id;

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

                /* this.renderer.transition(15, true, () => {

                    }); */
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
            /* this.renderer.transition(15, false, () => {
                        if (this.queueColour) {
                            this.renderer.updateDarkMask(this.queueColour);
                            this.queueColour = null;
                        }
                    }); */
        });

        this.messages.onDespawn((id) => {
            const entity = this.entities.get(id);

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

            if (
                this.game.player.hasTarget() &&
                this.game.player.target.id === entity.id
            )
                this.game.player.removeTarget();

            this.entities.grids.removeFromPathingGrid(
                entity.gridX,
                entity.gridY
            );

            if (
                entity.id !== this.game.player.id &&
                this.game.player.getDistance(entity) < 5
            )
                this.audio.play(
                    Modules.AudioTypes.SFX,
                    'kill' + Math.floor(Math.random() * 2 + 1)
                );

            entity.hitPoints = 0;

            entity.setSprite(this.game.getSprite('death'));

            entity.animate('death', 120, 1, () => {
                this.entities.unregisterPosition(entity);
                delete this.entities.entities[entity.id];
            });
        });

        this.messages.onCombat((opcode, info) => {
            const attacker = this.entities.get(info.attackerId);
            const target = this.entities.get(info.targetId);

            if (!target || !attacker) return;

            switch (opcode) {
                case Packets.CombatOpcode.Initiate:
                    attacker.setTarget(target);

                    target.addAttacker(attacker);

                    if (
                        target.id === this.game.player.id ||
                        attacker.id === this.game.player.id
                    )
                        this.socket.send(Packets.Combat, [
                            Packets.CombatOpcode.Initiate,
                            attacker.id,
                            target.id
                        ]);

                    break;

                case Packets.CombatOpcode.Hit:
                    const hit = info.hitInfo;
                    const isPlayer = target.id === this.game.player.id;

                    if (!hit.isAoE && !hit.isPoison) {
                        attacker.lookAt(target);
                        attacker.performAction(
                            attacker.orientation,
                            Modules.Actions.Attack
                        );
                    } else if (hit.hasTerror) target.terror = true;

                    switch (hit.type) {
                        case Modules.Hits.Critical:
                            target.critical = true;

                            break;

                        default:
                            if (
                                attacker.id === this.game.player.id &&
                                hit.damage > 0
                            )
                                this.audio.play(
                                    Modules.AudioTypes.SFX,
                                    'hit' + Math.floor(Math.random() * 2 + 1)
                                );

                            break;
                    }

                    this.info.create(
                        hit.type,
                        [hit.damage, isPlayer],
                        target.x,
                        target.y
                    );

                    if (target.hurtSprite) {
                        target.sprite = target.hurtSprite;
                        setTimeout(() => {
                            target.sprite = target.normalSprite;
                        }, 75);
                    }

                    attacker.triggerHealthBar();
                    target.triggerHealthBar();

                    if (isPlayer && hit.damage > 0)
                        this.audio.play(Modules.AudioTypes.SFX, 'hurt');

                    break;

                case Packets.CombatOpcode.Finish:
                    if (target) {
                        target.removeTarget();
                        target.forget();
                    }

                    if (attacker) attacker.removeTarget();

                    break;

                case Packets.CombatOpcode.Sync:
                    if (target.x !== info.x || target.y !== info.y)
                        target.go(info.x, info.y);

                    break;
            }
        });

        this.messages.onAnimation((id, info) => {
            const entity = this.entities.get(id);
            const animation = info.shift();
            const speed = info.shift();
            const count = info.shift();

            if (!entity) return;

            entity.animate(animation, speed, count);
        });

        this.messages.onProjectile((opcode, info) => {
            switch (opcode) {
                case Packets.ProjectileOpcode.Create:
                    this.entities.create(info);

                    break;
            }
        });

        this.messages.onPopulation((population) => {
            this.population = population;
        });

        this.messages.onPoints((data) => {
            const entity = this.entities.get(data.id);

            if (!entity) return;

            if (data.hitPoints) {
                entity.setHitPoints(data.hitPoints);

                if (
                    this.game.player.hasTarget() &&
                    this.game.player.target.id === entity.id &&
                    this.input.overlay.updateCallback
                )
                    this.input.overlay.updateCallback(
                        entity.id,
                        data.hitPoints
                    );
            }

            if (data.mana) entity.setMana(data.mana);
        });

        this.messages.onNetwork(() => {
            this.socket.send(Packets.Network, [Packets.NetworkOpcode.Pong]);
        });

        this.messages.onChat((info) => {
            if (this.game.isDebug()) console.info(info);

            if (info.withBubble) {
                const entity = this.entities.get(info.id);

                if (entity) {
                    info.name =
                        info.name.charAt(0).toUpperCase() + info.name.substr(1);

                    this.bubble.create(info.id, info.text, info.duration);
                    this.bubble.setTo(entity);

                    this.audio.play(Modules.AudioTypes.SFX, 'npctalk');
                }
            }

            if (info.isGlobal) info.name = '[Global] ' + info.name;

            this.input.chatHandler.add(info.name, info.text, info.colour);
        });

        this.messages.onCommand((info) => {
            /**
             * This is for random miscellaneous commands that require
             * a specific action done by the client as opposed to
             * packet-oriented ones.
             */

            console.info(info);

            switch (info.command) {
                case 'debug':
                    this.renderer.debugging = !this.renderer.debugging;
                    break;

                case 'toggleheal':
                    console.info('llll');
                    this.game.player.healing = true;
                    break;
            }
        });

        this.messages.onInventory((opcode, info) => {
            switch (opcode) {
                case Packets.InventoryOpcode.Batch:
                    const inventorySize = info.shift();
                    const data = info.shift();

                    this.interface.loadInventory(inventorySize, data);

                    break;

                case Packets.InventoryOpcode.Add:
                    if (!this.interface.inventory) return;

                    this.interface.inventory.add(info);

                    if (!this.interface.bank) return;

                    this.interface.addInventory(info);

                    break;

                case Packets.InventoryOpcode.Remove:
                    if (!this.interface.bank) return;

                    this.interface.removeInventory(info);

                    if (!this.interface.inventory) return;

                    this.interface.inventory.remove(info);

                    break;
            }
        });

        this.messages.onBank((opcode, info) => {
            switch (opcode) {
                case Packets.BankOpcode.Batch:
                    const bankSize = info.shift();
                    const data = info.shift();

                    this.interface.loadBank(bankSize, data);

                    break;

                case Packets.BankOpcode.Add:
                    if (!this.interface.bank) return;

                    this.interface.bank.add(info);

                    break;

                case Packets.BankOpcode.Remove:
                    this.interface.bank.remove(info);

                    break;
            }
        });

        this.messages.onAbility((opcode, info) => {});

        this.messages.onQuest((opcode, info) => {
            switch (opcode) {
                case Packets.QuestOpcode.AchievementBatch:
                    this.interface
                        .getQuestPage()
                        .loadAchievements(info.achievements);

                    break;

                case Packets.QuestOpcode.QuestBatch:
                    this.interface.getQuestPage().loadQuests(info.quests);

                    break;

                case Packets.QuestOpcode.Progress:
                    this.interface.getQuestPage().progress(info);

                    break;

                case Packets.QuestOpcode.Finish:
                    this.interface.getQuestPage().finish(info);

                    break;
            }
        });

        this.messages.onNotification((opcode, message) => {
            switch (opcode) {
                case Packets.NotificationOpcode.Ok:
                    this.interface.displayNotify(message);

                    break;

                case Packets.NotificationOpcode.YesNo:
                    this.interface.displayConfirm(message);

                    break;

                case Packets.NotificationOpcode.Text:
                    this.input.chatHandler.add('WORLD', message);

                    break;
            }
        });

        this.messages.onBlink((instance) => {
            const item = this.entities.get(instance);

            if (!item) return;

            item.blink(150);
        });

        this.messages.onHeal((info) => {
            const entity = this.entities.get(info.id);

            if (!entity) return;

            /**
             * Healing just triggers an info to display.
             */

            switch (info.type) {
                case 'health':
                    this.info.create(
                        Modules.Hits.Heal,
                        [info.amount],
                        entity.x,
                        entity.y
                    );

                    this.game.player.healing = true;

                    break;

                case 'mana':
                    this.info.create(
                        Modules.Hits.Mana,
                        [info.amount],
                        entity.x,
                        entity.y
                    );

                    break;
            }

            entity.triggerHealthBar();
        });

        this.messages.onExperience((info) => {
            const entity = this.entities.get(info.id);

            if (!entity || entity.type !== 'player') return;

            /**
             * We only receive level information about other entities.
             */
            if (entity.level !== info.level) {
                entity.level = info.level;
                this.info.create(
                    Modules.Hits.LevelUp,
                    null,
                    entity.x,
                    entity.y
                );
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

            this.interface.profile.update();
        });

        this.messages.onDeath((id) => {
            const entity = this.entities.get(id);

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
                case Packets.NPCOpcode.Talk: {
                    const entity = this.entities.get(info.id);
                    const message = info.text;
                    const isNPC = !info.nonNPC;

                    if (!entity) return;

                    let sound;

                    if (isNPC) {
                        if (!message) {
                            sound = 'npc-end';
                            this.bubble.destroy(info.id);
                        } else {
                            const bubble = this.bubble.create(info.id, message);

                            this.bubble.setTo(entity);

                            if (
                                this.renderer.mobile &&
                                this.renderer.autoCentre
                            )
                                this.renderer.camera.centreOn(this.game.player);
                        }
                    } else {
                        this.bubble.create(info.id, message, this.time, 5000);
                        this.bubble.setTo(entity);
                    }

                    sound = 'npc';

                    this.audio.play(Modules.AudioTypes.SFX, sound);

                    this.game.player.disableAction = true;

                    break;
                }
                case Packets.NPCOpcode.Bank:
                    this.interface.bank.display();
                    break;

                case Packets.NPCOpcode.Enchant:
                    this.interface.enchant.display();
                    break;

                case Packets.NPCOpcode.Countdown:
                    const cEntity = this.entities.get(info.id);
                    const countdown = info.countdown;

                    if (cEntity) cEntity.setCountdown(countdown);

                    break;
            }
        });

        this.messages.onRespawn((id, x, y) => {
            if (id !== this.game.player.id) {
                console.error('Player id mismatch.');
                return;
            }

            this.game.player.setGridPosition(x, y);
            this.entities.registerPosition(this.game.player);
            this.renderer.camera.centreOn(this.game.player);

            this.game.player.currentAnimation = null;
            this.game.player.setSprite(
                this.game.getSprite(this.game.player.getSpriteName())
            );
            this.game.player.idle();

            this.entities.addEntity(this.game.player);

            this.game.player.dead = false;
        });

        this.messages.onEnchant((opcode, info) => {
            const type = info.type;
            const index = info.index;

            switch (opcode) {
                case Packets.EnchantOpcode.Select:
                    this.interface.enchant.add(type, index);

                    break;

                case Packets.EnchantOpcode.Remove:
                    this.interface.enchant.moveBack(type, index);

                    break;
            }
        });

        this.messages.onGuild((opcode, info) => {
            switch (opcode) {
                case Packets.GuildOpcode.Create:
                    break;

                case Packets.GuildOpcode.Join:
                    break;
            }
        });

        this.messages.onPointer((opcode, info) => {
            switch (opcode) {
                case Packets.PointerOpcode.NPC:
                    const entity = this.entities.get(info.id);

                    if (!entity) return;

                    this.pointer.create(entity.id, Modules.Pointers.Entity);
                    this.pointer.setToEntity(entity);

                    break;

                case Packets.PointerOpcode.Location:
                    this.pointer.create(info.id, Modules.Pointers.Position);
                    this.pointer.setToPosition(
                        info.id,
                        info.x * 16,
                        info.y * 16
                    );

                    break;

                case Packets.PointerOpcode.Relative:
                    this.pointer.create(info.id, Modules.Pointers.Relative);
                    this.pointer.setRelative(info.id, info.x, info.y);

                    break;

                case Packets.PointerOpcode.Remove:
                    this.pointer.clean();

                    break;

                case Packets.PointerOpcode.Button:
                    this.pointer.create(
                        info.id,
                        Modules.Pointers.Button,
                        info.button
                    );

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

        this.messages.onShop((opcode, info) => {
            const shopData = info.shopData;

            switch (opcode) {
                case Packets.ShopOpcode.Open:
                    this.interface.shop.open(shopData.id);
                    this.interface.shop.update(shopData);

                    break;

                case Packets.ShopOpcode.Buy:
                    break;

                case Packets.ShopOpcode.Sell:
                    break;

                case Packets.ShopOpcode.Select:
                    if (this.interface.shop.isShopOpen(info.id))
                        this.interface.shop.move(info);

                    break;

                case Packets.ShopOpcode.Remove:
                    if (this.interface.shop.isShopOpen(info.id))
                        this.interface.shop.moveBack(info.index);

                    break;

                case Packets.ShopOpcode.Refresh:
                    if (this.interface.shop.isShopOpen(info.id))
                        this.interface.shop.update(info);

                    break;
            }
        });

        this.messages.onMinigame((opcode, info) => {
            switch (opcode) {
                case Packets.MinigameOpcode.TeamWar:
                    this.teamWar.handle(info);

                    break;
            }
        });

        this.messages.onRegion((opcode, info) => {
            switch (opcode) {
                case Packets.RegionOpcode.Render:
                    this.map.synchronize(info);

                    break;

                case Packets.RegionOpcode.Modify:
                    this.map.data[info.index] = info.data;

                    break;

                case Packets.RegionOpcode.Update:
                    const entity = this.entities.get(info.id);

                    if (!entity || entity.id === this.game.player.id) return;

                    this.entities.removeEntity(entity);

                    break;
            }

            this.map.updateCollisions();
            this.entities.grids.resetPathingGrid();

            this.renderer.forceRendering = true;
            this.renderer.updateAnimatedTiles();
        });

        this.messages.onOverlay((opcode, info) => {
            switch (opcode) {
                case Packets.OverlayOpcode.Set:
                    this.overlays.updateOverlay(info.image);

                    if (!this.renderer.transitioning)
                        this.renderer.updateDarkMask(info.colour);
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
                        true
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

        this.messages.onCamera((opcode, info) => {
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

                case Packets.CameraOpcode.Player:
                    const middle = this.renderer.getMiddle();

                    this.renderer.removeAllLights();
                    this.renderer.addLight(
                        middle.x,
                        middle.y,
                        160,
                        0.8,
                        'rgba(0,0,0,0.3)',
                        false
                    );

                    break;
            }
        });

        this.messages.onBubble((info) => {
            if (!info.text) {
                this.bubble.destroy(info.id);
                return;
            }

            this.bubble.create(
                info.id,
                info.text,
                info.duration,
                info.isObject,
                info.info
            );
            this.bubble.setTo(info.info);
        });
    }

    time(id: any, message: any, time: any, arg3: number) {
        // throw new Error('Method not implemented.');
    }
}
