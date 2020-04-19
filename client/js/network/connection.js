/* global log, _ */

define(['./impl/teamwar'], function(TeamWar) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;
            self.app = game.app;
            self.audio = game.audio;
            self.messages = game.messages;
            self.storage = game.storage;
            self.socket = game.socket;
            self.input = game.input;
            self.interface = game.interface;
            self.entities = game.entities;
            self.map = game.map;
            self.overlays = game.overlays;
            self.renderer = game.renderer;
            self.bubble = game.bubble;
            self.info = game.info;
            self.pointer = game.pointer;
            self.inventory = game.inventory;

            self.teamWar = new TeamWar();

            self.load();
        },

        load: function() {
            var self = this;

            self.messages.onHandshake(function(data) {

                self.game.id = data.id;
                self.game.development = data.development;

                self.game.ready = true;

                if (!self.game.player)
                    self.game.createPlayer();

                if (!self.map)
                    self.game.loadMap();

                self.app.updateLoader('Logging in');

                if (self.app.isRegistering()) {
                    var registerInfo = self.app.registerFields,
                        username = registerInfo[0].val(),
                        password = registerInfo[1].val(),
                        email = registerInfo[3].val();

                    self.socket.send(Packets.Intro, [Packets.IntroOpcode.Register, username, password, email]);
                } else if (self.app.isGuest()) {
                    self.socket.send(Packets.Intro, [Packets.IntroOpcode.Guest, 'n', 'n', 'n']);
                } else {
                    var loginInfo = self.app.loginFields,
                        name = loginInfo[0].val(),
                        pass = loginInfo[1].val();

                    self.socket.send(Packets.Intro, [Packets.IntroOpcode.Login, name, pass]);

                    if (self.game.hasRemember()) {
                        self.storage.data.player.username = name;
                        self.storage.data.player.password = pass;
                    } else {
                        self.storage.data.player.username = '';
                        self.storage.data.player.password = '';
                    }

                    self.storage.save();
                }

            });

            self.messages.onWelcome(function(data) {

                self.interface.loadHeader();

                self.game.player.load(data);

                self.game.start();
                self.game.postLoad();

            });

            self.messages.onEquipment(function(opcode, info) {

                switch (opcode) {
                    case Packets.EquipmentOpcode.Batch:

                        _.each(info, function(data) {
                            self.game.player.setEquipment(data.type, data.name, data.string,
                                data.count, data.ability, data.abilityLevel, data.power);
                        });

                        self.interface.loadProfile();

                        break;

                    case Packets.EquipmentOpcode.Equip:

                        self.game.player.setEquipment(info.type, info.name, info.string,
                                info.count, info.ability, info.abilityLevel, info.power);

                        self.interface.profile.update();

                        break;

                    case Packets.EquipmentOpcode.Unequip:

                        var type = info.shift();

                        self.game.player.unequip(type);

                        if (type === 'armour')
                            self.game.player.setSprite(self.game.getSprite(self.game.player.getSpriteName()));

                        self.interface.profile.update();

                        break;
                }

            });

            self.messages.onSpawn(function(data) {
                self.entities.create(data.shift());
            });

            self.messages.onEntityList(function(data) {
                var ids = _.pluck(self.entities.getAll(), 'id'),
                    known = _.intersection(ids, data),
                    newIds = _.difference(data, known);

                self.entities.decrepit = _.reject(self.entities.getAll(), function(entity) {
                    return _.include(known, entity.id) || entity.id === self.game.player.id;
                });

                self.entities.clean(newIds);

                self.socket.send(Packets.Who, newIds);
            });

            self.messages.onSync(function(data) {
                var entity = self.entities.get(data.id);

                if (!entity || entity.type !== 'player')
                    return;

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

                if (data.armour)
                    entity.setSprite(self.game.getSprite(data.armour));

                if (data.weapon)
                    entity.setEquipment(data.weapon.type, data.weapon.name,
                        data.weapon.string, data.weapon.count, data.weapon.ability,
                        data.weapon.abilityLevel, data.weapon.power);

                entity.attackRange = data.attackRange;
                entity.setPoison(data.poison);

                entity.movementSpeed = data.movementSpeed;

                self.interface.profile.update();
            });

            self.messages.onMovement(function(opcode, info) {

                switch(opcode) {
                    case Packets.MovementOpcode.Move:
                        var entity = self.entities.get(info.id);

                        if (!entity)
                            return;

                        if (info.forced)
                            entity.stop(true);

                        entity.go(info.x, info.y);

                        break;

                    case Packets.MovementOpcode.Follow:

                        var follower = self.entities.get(info.attackerId),
                            followee = self.entities.get(info.targetId);

                        if (!followee || !follower)
                            return;

                        follower.follow(followee);

                        break;

                    case Packets.MovementOpcode.Stop:

                        var sEntity = self.entities.get(info.id),
                            force = info.force;

                        if (!sEntity)
                            return;

                        sEntity.stop(force);

                        break;

                    case Packets.MovementOpcode.Freeze:
                    case Packets.MovementOpcode.Stunned:

                        var pEntity = self.entities.get(info.id);

                        if (!pEntity)
                            return;

                        if (info.state)
                            pEntity.stop(false);

                        if (opcode === Packets.MovementOpcode.Stunned)
                            pEntity.stunned = info.state;
                        else if (opcode === Packets.MovementOpcode.Freeze)
                            pEntity.frozen = info.state;

                        break;


                        case Packets.MovementOpcode.Orientate:
                            var player = info.shift(),
                                orientation = info.shift(),
                                entity = self.entities.get(player);

                            // entity.stop();
                            entity.performAction(orientation, Modules.Actions.Orientate);

                        break;
                }

            });

            self.messages.onTeleport(function(info) {
                var entity = self.entities.get(info.id),
                    isPlayer = info.id === self.game.player.id;

                if (!entity)
                    return;

                entity.stop(true);
                entity.frozen = true;

                if (isPlayer)
                    self.bubble.clean();
                else
                    self.bubble.destroy(info.id);

                /**
                 * Teleporting an entity seems to cause a glitch with the
                 * hitbox. Make sure you keep an eye out for this.
                 */

                var doTeleport = function() {

                    self.entities.unregisterPosition(entity);
                    entity.setGridPosition(info.x, info.y);

                    if (isPlayer) {

                        self.entities.clearPlayers(self.game.player);
                        self.game.player.clearHealthBar();
                        self.renderer.camera.centreOn(entity);
                        self.renderer.updateAnimatedTiles();

                    } else if (entity.type === 'player') {
                        delete self.entities.entities[entity.id];
                        return;
                    }

                    self.socket.send(Packets.Request, [self.game.player.id]);

                    self.entities.registerPosition(entity);
                    entity.frozen = false;

                    /*self.renderer.transition(15, true, function() {

                    });*/

                };

                if (info.withAnimation) {

                    var originalSprite = entity.sprite;

                    entity.teleporting = true;

                    entity.setSprite(self.game.getSprite('death'));

                    entity.animate('death', 240, 1, function() {
                        doTeleport();

                        entity.currentAnimation = null;

                        entity.setSprite(originalSprite);
                        entity.idle();

                        entity.teleporting = false;

                    });

                } else
                    doTeleport();
                    /*self.renderer.transition(15, false, function() {
                        if (self.queueColour) {
                            self.renderer.updateDarkMask(self.queueColour);
                            self.queueColour = null;
                        }
                    });*/

            });

            self.messages.onDespawn(function(id) {
                var entity = self.entities.get(id);

                if (!entity)
                    return;

                switch (entity.type) {
                    case 'item':

                        self.entities.removeItem(entity);

                        return;

                    case 'chest':

                        entity.setSprite(self.game.getSprite('death'));

                        entity.setAnimation('death', 120, 1, function() {
                            self.entities.unregisterPosition(entity);
                            delete self.entities.entities[entity.id];
                        });

                        return;
                }

                entity.dead = true;

                entity.stop();

                self.bubble.destroy(entity.id);

                if (self.game.player.hasTarget() && self.game.player.target.id === entity.id)
                    self.game.player.removeTarget();

                self.entities.grids.removeFromPathingGrid(entity.gridX, entity.gridY);

                if (entity.id !== self.game.player.id && self.game.player.getDistance(entity) < 5)
                    self.audio.play(Modules.AudioTypes.SFX, 'kill' + Math.floor(Math.random() * 2 + 1));

                entity.hitPoints = 0;

                if (!entity.sprite.hasDeathAnimation)
                    entity.setSprite(self.game.getSprite('death'));

                entity.animate('death', 120, 1, function() {
                    self.entities.unregisterPosition(entity);
                    delete self.entities.entities[entity.id];
                });

            });

            self.messages.onCombat(function(opcode, info) {
                var attacker = self.entities.get(info.attackerId),
                    target = self.entities.get(info.targetId);

                if (!target || !attacker)
                    return;

                switch (opcode) {
                    case Packets.CombatOpcode.Initiate:
                        attacker.setTarget(target);

                        target.addAttacker(attacker);

                        if (target.id === self.game.player.id || attacker.id === self.game.player.id)
                            self.socket.send(Packets.Combat, [Packets.CombatOpcode.Initiate, attacker.id, target.id]);

                        break;

                    case Packets.CombatOpcode.Hit:

                        var hit = info.hitInfo,
                            isPlayer = target.id === self.game.player.id;

                        if (!hit.isAoE && !hit.isPoison) {
                            attacker.lookAt(target);
                            attacker.performAction(attacker.orientation, Modules.Actions.Attack);

                        } else
                            if (hit.hasTerror)
                                target.terror = true;

                        switch (hit.type) {

                            case Modules.Hits.Critical:

                                target.critical = true;

                                break;

                            default:

                                if (attacker.id === self.game.player.id && hit.damage > 0)
                                    self.audio.play(Modules.AudioTypes.SFX, 'hit' + Math.floor(Math.random() * 2 + 1));

                                break;
                        }

                        self.info.create(hit.type, [hit.damage, isPlayer], target.x, target.y);

                        if (target.hurtSprite) {
                            target.sprite = target.hurtSprite;
                            setTimeout(function() { target.sprite = target.normalSprite; }, 75);
                        }

                        attacker.triggerHealthBar();
                        target.triggerHealthBar();

                        if (isPlayer && hit.damage > 0)
                            self.audio.play(Modules.AudioTypes.SFX, 'hurt');

                        break;

                    case Packets.CombatOpcode.Finish:

                        if (target) {
                            target.removeTarget();
                            target.forget();
                        }

                        if (attacker)
                            attacker.removeTarget();

                        break;

                    case Packets.CombatOpcode.Sync:

                        if (target.x !== info.x || target.y !== info.y)
                            target.go(info.x, info.y);

                        break;
                }
            });

            self.messages.onAnimation(function(id, info) {
                var entity = self.entities.get(id),
                    animation = info.shift(),
                    speed = info.shift(),
                    count = info.shift();

                if (!entity)
                    return;

                entity.animate(animation, speed, count);
            });

            self.messages.onProjectile(function(opcode, info) {

                switch (opcode) {

                    case Packets.ProjectileOpcode.Create:

                        self.entities.create(info);

                        break;
                }

            });

            self.messages.onPopulation(function(population) {
                self.population = population;
            });

            self.messages.onPoints(function(data) {

                var entity = self.entities.get(data.id);

                if (!entity)
                    return;

                if (data.hitPoints) {
                    entity.setHitPoints(data.hitPoints);

                    if (self.game.player.hasTarget() && self.game.player.target.id === entity.id && self.input.overlay.updateCallback)
                        self.input.overlay.updateCallback(entity.id, data.hitPoints);

                }

                if (data.mana)
                    entity.setMana(data.mana);
            });

            self.messages.onNetwork(function() {
                self.socket.send(Packets.Network, [Packets.NetworkOpcode.Pong]);
            });

            self.messages.onChat(function(info) {

                if (self.game.isDebug())
                    log.info(info);

                if (info.withBubble) {
                    var entity = self.entities.get(info.id);

                    if (entity) {
                        info.name = info.name.charAt(0).toUpperCase() + info.name.substr(1);

                        self.bubble.create(info.id, info.text, info.duration);
                        self.bubble.setTo(entity);

                        self.audio.play(Modules.AudioTypes.SFX, 'npctalk');
                    }
                }

                if (info.isGlobal)
                    info.name = '[Global] ' + info.name;

                self.input.chatHandler.add(info.name, info.text, info.colour);

            });

            self.messages.onCommand(function(info) {

                /**
                 * This is for random miscellaneous commands that require
                 * a specific action done by the client as opposed to
                 * packet-oriented ones.
                 */

                log.info(info);

                switch (info.command) {

                    case 'debug':
                        self.renderer.debugging = !self.renderer.debugging;
                        break;

                    case 'toggleheal':
                        log.info('llll');
                        self.game.player.healing = true;
                        break;

                }

            });

            self.messages.onInventory(function(opcode, info) {

                switch (opcode) {
                    case Packets.InventoryOpcode.Batch:

                        var inventorySize = info.shift(),
                            data = info.shift();

                        self.interface.loadInventory(inventorySize, data);

                        break;

                    case Packets.InventoryOpcode.Add:

                        if (!self.interface.inventory)
                            return;

                        self.interface.inventory.add(info);

                        if (!self.interface.bank)
                            return;

                        self.interface.addInventory(info);

                        break;

                    case Packets.InventoryOpcode.Remove:

                        if (!self.interface.bank)
                            return;

                        self.interface.removeInventory(info);

                        if (!self.interface.inventory)
                            return;

                        self.interface.inventory.remove(info);

                        break;
                }

            });

            self.messages.onBank(function(opcode, info) {
                switch(opcode) {

                    case Packets.BankOpcode.Batch:

                        var bankSize = info.shift(),
                            data = info.shift();

                        self.interface.loadBank(bankSize, data);

                        break;


                    case Packets.BankOpcode.Add:

                        if (!self.interface.bank)
                            return;

                        self.interface.bank.add(info);

                        break;

                    case Packets.BankOpcode.Remove:

                        self.interface.bank.remove(info);

                        break;
                }
            });

            self.messages.onAbility(function(opcode, info) {

            });

            self.messages.onQuest(function(opcode, info) {

                switch (opcode) {
                    case Packets.QuestOpcode.AchievementBatch:

                        self.interface.getQuestPage().loadAchievements(info.achievements);

                        break;

                    case Packets.QuestOpcode.QuestBatch:

                        self.interface.getQuestPage().loadQuests(info.quests);

                        break;

                    case Packets.QuestOpcode.Progress:

                        self.interface.getQuestPage().progress(info);

                        break;

                    case Packets.QuestOpcode.Finish:

                        self.interface.getQuestPage().finish(info);

                        break;
                }

            });

            self.messages.onNotification(function(opcode, message, colour) {

                switch (opcode) {
                    case Packets.NotificationOpcode.Ok:

                        self.interface.displayNotify(message);

                        break;

                    case Packets.NotificationOpcode.YesNo:

                        self.interface.displayConfirm(message);

                        break;

                    case Packets.NotificationOpcode.Text:

                        self.input.chatHandler.add('WORLD', message, colour);

                        break;
                }

            });

            self.messages.onBlink(function(instance) {
                var item = self.entities.get(instance);

                if (!item)
                    return;

                item.blink(150);
            });

            self.messages.onHeal(function(info) {
                var entity = self.entities.get(info.id);

                if (!entity)
                    return;

                /**
                 * Healing just triggers an info to display.
                 */

                switch (info.type) {
                    case 'health':

                        self.info.create(Modules.Hits.Heal, [info.amount], entity.x, entity.y);

                        self.game.player.healing = true;

                        break;

                    case 'mana':

                        self.info.create(Modules.Hits.Mana, [info.amount], entity.x, entity.y);

                        break;
                }

                entity.triggerHealthBar();
            });

            self.messages.onExperience(function(info) {
                var entity = self.entities.get(info.id);

                if (!entity || entity.type !== 'player')
                    return;

                /**
                 * We only receive level information about other entities.
                 */
                if (entity.level !== info.level) {

                    entity.level = info.level;
                    self.info.create(Modules.Hits.LevelUp, null, entity.x, entity.y);

                }

                /**
                 * When we receive experience information about our own player
                 * we update the experience bar and create an info.
                 */

                if (entity.id === self.game.player.id) {

                    if (info.id === self.game.player.id)
                        self.game.player.setExperience(info.experience, info.nextExperience, info.prevExperience);

                    self.info.create(Modules.Hits.Experience, [info.amount], entity.x, entity.y);
                }

                self.interface.profile.update();

            });

            self.messages.onDeath(function(id) {
                var entity = self.entities.get(id);

                if (!entity || id !== self.game.player.id)
                    return;

                self.audio.stop();

                //self.audio.play(Modules.AudioTypes.SFX, 'death');

                self.game.player.dead = true;
                self.game.player.removeTarget();
                self.game.player.orientation = Modules.Orientation.Down;

                self.app.body.addClass('death');
            });

            self.messages.onAudio(function(newSong) {
                self.audio.newSong = newSong;

                if (!self.audio.newSong || Detect.isMobile())
                    return;

                self.audio.update();
            });

            self.messages.onNPC(function(opcode, info) {

                switch(opcode) {

                    case Packets.NPCOpcode.Talk:

                        var entity = self.entities.get(info.id),
                            message = info.text,
                            isNPC = !info.nonNPC;

                        if (!entity)
                            return;

                        if (isNPC) {

                            if (!message) {
                                sound = 'npc-end';
                                self.bubble.destroy(info.id);

                            } else {

                                var bubble = self.bubble.create(info.id, message);

                                self.bubble.setTo(entity);

                                if (self.renderer.mobile && self.renderer.autoCentre)
                                    self.renderer.camera.centreOn(self.game.player);
                            }

                        } else {
                            self.bubble.create(info.id, message, self.time, 5000);
                            self.bubble.setTo(entity);
                        }

                        var sound = 'npc';

                        self.audio.play(Modules.AudioTypes.SFX, sound);

                        self.game.player.disableAction = true;

                        break;

                    case Packets.NPCOpcode.Bank:
                        self.interface.bank.display();
                        break;

                    case Packets.NPCOpcode.Enchant:
                        self.interface.enchant.display();
                        break;

                    case Packets.NPCOpcode.Countdown:

                        var cEntity = self.entities.get(info.id),
                            countdown = info.countdown;

                        if (cEntity)
                            cEntity.setCountdown(countdown);

                        break;
                }

            });

            self.messages.onRespawn(function(id, x, y) {
                if (id !== self.game.player.id) {
                    log.error('Player id mismatch.');
                    return;
                }

                self.game.player.setGridPosition(x, y);
                self.entities.registerPosition(self.game.player);
                self.renderer.camera.centreOn(self.game.player);

                self.game.player.currentAnimation = null;
                self.game.player.setSprite(self.game.getSprite(self.game.player.getSpriteName()));
                self.game.player.idle();

                self.entities.addEntity(self.game.player);

                self.game.player.dead = false;
            });

            self.messages.onEnchant(function(opcode, info) {
                var type = info.type,
                    index = info.index;

                switch (opcode) {
                    case Packets.EnchantOpcode.Select:

                        self.interface.enchant.add(type, index);

                        break;

                    case Packets.EnchantOpcode.Remove:

                        self.interface.enchant.moveBack(type, index);

                        break;

                }

            });

            self.messages.onGuild(function(opcode, info) {

                switch (opcode) {

                    case Packets.GuildOpcode.Create:

                        break;

                    case Packets.GuildOpcode.Join:

                        break;
                }

            });

            self.messages.onPointer(function(opcode, info) {

                switch (opcode) {
                    case Packets.PointerOpcode.NPC:
                        var entity = self.entities.get(info.id);

                        if (!entity)
                            return;

                        self.pointer.create(entity.id, Modules.Pointers.Entity);
                        self.pointer.setToEntity(entity);

                        break;

                    case Packets.PointerOpcode.Location:

                        self.pointer.create(info.id, Modules.Pointers.Position);
                        self.pointer.setToPosition(info.id, info.x * 16, info.y * 16);

                        break;

                    case Packets.PointerOpcode.Relative:

                        self.pointer.create(info.id, Modules.Pointers.Relative);
                        self.pointer.setRelative(info.id, info.x, info.y);

                        break;

                    case Packets.PointerOpcode.Remove:

                        self.pointer.clean();

                        break;

                    case Packets.PointerOpcode.Button:

                        self.pointer.create(info.id, Modules.Pointers.Button, info.button);

                        break;
                }

            });

            self.messages.onPVP(function(id, pvp) {

                if (self.game.player.id === id)
                    self.game.pvp = pvp;
                else {
                    var entity = self.entities.get(id);

                    if (entity)
                        entity.pvp = pvp;
                }

            });

            self.messages.onShop(function(opcode, info) {
                var shopData = info.shopData;

                switch (opcode) {
                    case Packets.ShopOpcode.Open:

                        self.interface.shop.open(shopData.id);
                        self.interface.shop.update(shopData);

                        break;

                    case Packets.ShopOpcode.Buy:

                        break;

                    case Packets.ShopOpcode.Sell:

                        break;

                    case Packets.ShopOpcode.Select:

                        if (self.interface.shop.isShopOpen(info.id))
                            self.interface.shop.move(info);

                        break;

                    case Packets.ShopOpcode.Remove:

                        if (self.interface.shop.isShopOpen(info.id))
                            self.interface.shop.moveBack(info.index);

                        break;

                    case Packets.ShopOpcode.Refresh:

                        if (self.interface.shop.isShopOpen(info.id))
                            self.interface.shop.update(info);

                        break;
                }

            });

            self.messages.onMinigame(function(opcode, info) {

                switch (opcode) {

                    case Packets.MinigameOpcode.TeamWar:

                        self.teamWar.handle(info);

                        break;

                }

            });

            self.messages.onRegion(function(opcode, info) {

                switch(opcode) {
                    case Packets.RegionOpcode.Render:

                        self.map.synchronize(info);

                        break;

                    case Packets.RegionOpcode.Modify:

                        self.map.data[info.index] = info.data;

                        break;

                    case Packets.RegionOpcode.Update:
                        var entity = self.entities.get(info.id);

                        if (!entity || entity.id === self.game.player.id)
                            return;

                        self.entities.removeEntity(entity);

                        break;
                }

                self.map.updateCollisions();
                self.entities.grids.resetPathingGrid();

                self.renderer.forceRendering = true;
                self.renderer.updateAnimatedTiles();

            });

            self.messages.onOverlay(function(opcode, info) {

                switch(opcode) {
                    case Packets.OverlayOpcode.Set:

                        self.overlays.updateOverlay(info.image);

                        if (!self.renderer.transitioning)
                            self.renderer.updateDarkMask(info.colour);
                        else
                            self.queueColour = info.colour;

                        break;

                    case Packets.OverlayOpcode.Remove:

                        self.renderer.removeAllLights();
                        self.overlays.currentOverlay = null;

                        break;

                    case Packets.OverlayOpcode.Lamp:

                        self.renderer.addLight(info.x, info.y, info.distance, info.diffuse, 'rgba(0,0,0,0.4)', true, info.objects);

                        break;

                    case Packets.OverlayOpcode.RemoveLamps:

                        self.renderer.removeAllLights();

                        break;

                    case Packets.OverlayOpcode.Darkness:

                        self.renderer.updateDarkMask(info.colour);

                        break;

                }

            });

            self.messages.onCamera(function(opcode, info) {

                if (self.game.player.x === 0 || self.game.player.y === 0) {
                    self.socket.send(Packets.Camera);
                    return;
                }

                if (!self.renderer.camera.centered)
                    return;

                self.renderer.camera.forceCentre(self.game.player);
                self.renderer.forceRendering = true;

                switch(opcode) {
                    case Packets.CameraOpcode.LockX:
                        self.renderer.camera.lockX = true;
                        break;

                    case Packets.CameraOpcode.LockY:
                        self.renderer.camera.lockY = true;
                        break;

                    case Packets.CameraOpcode.FreeFlow:
                        self.renderer.removeNonRelativeLights();

                        self.renderer.camera.lockX = false;
                        self.renderer.camera.lockY = false;
                        break;

                    case Packets.CameraOpcode.Player:
                        var middle = self.renderer.getMiddle();

                        self.renderer.removeAllLights();
                        self.renderer.addLight(middle.x, middle.y, 160, 0.8, 'rgba(0,0,0,0.3)', false);

                        break;
                }

            });

            self.messages.onBubble(function(info) {

                if (!info.text) {
                    self.bubble.destroy(info.id);
                    return;
                }

                self.bubble.create(info.id, info.text, info.duration, info.isObject, info.info);
                self.bubble.setTo(info.info);

            });
        }

    });

});
