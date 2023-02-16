import Character from '../game/entity/character/character';
import Item from '../game/entity/objects/item';
import Formulas from '../info/formulas';
import { Command, Notification, NPC, Pointer, Store } from '../network/packets';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';
import Filter from '@kaetram/common/util/filter';

import type Mob from '../game/entity/character/mob/mob';
import type Achievement from '../game/entity/character/player/achievement/achievement';
import type Player from '../game/entity/character/player/player';
import type Quest from '../game/entity/character/player/quest/quest';
import type Skill from '../game/entity/character/player/skill/skill';
import type Entity from '../game/entity/entity';
import type Region from '../game/map/region';

export default class Commands {
    private world;
    private entities;

    public constructor(private player: Player) {
        let { world } = player;

        this.world = world;
        this.entities = world.entities;
    }

    public parse(rawText: string): void {
        let blocks = rawText.slice(1).split(' ');

        if (blocks.length === 0) return;

        let command = blocks.shift()!;

        this.handlePlayerCommands(command, blocks);
        this.handleArtistCommands(command, blocks);
        this.handleModeratorCommands(command, blocks);
        this.handleAdminCommands(command, blocks);
    }

    /**
     * Commands that are accessible to all the players.
     * @param command The command that was entered.
     * @param blocks Associated string blocks after the command.
     */

    private handlePlayerCommands(command: string, blocks: string[]): void {
        switch (command) {
            case 'players': {
                let population = this.world.getPopulation(),
                    singular = population === 1;

                this.player.notify(
                    `There ${singular ? 'is' : 'are'} currently ${population} ${
                        singular ? 'person' : 'people'
                    } online.`
                );

                return;
            }

            case 'coords': {
                this.player.send(
                    new Notification(Opcodes.Notification.Text, {
                        message: `x: ${this.player.x} y: ${this.player.y}`
                    })
                );
                return;
            }

            case 'global': {
                return this.player.chat(
                    Filter.clean(blocks.join(' ')),
                    true,
                    false,
                    'rgba(191, 161, 63, 1.0)'
                );
            }

            case 'pm':
            case 'msg': {
                let asterikBlocks = blocks.join(' ').split('*'),
                    [, username] = asterikBlocks;

                if (!username) return;

                let message = blocks.slice(username.split(' ').length).join(' ');

                this.player.sendPrivateMessage(username.toLowerCase(), message);

                break;
            }

            case 'ping': {
                this.player.ping();
                break;
            }
        }
    }

    /**
     * Commands accessible only to artists and administrators.
     * @param command The command that was entered.
     * @param blocks The associated string blocks after the command.
     */

    private handleArtistCommands(command: string, blocks: string[]): void {
        if (!this.player.isArtist() && !this.player.isAdmin()) return;

        switch (command) {
            case 'toggle': {
                let key = blocks.shift()!;

                if (!key) return this.player.notify('No key specified.');

                return this.player.send(new Command({ command: `toggle${key}` }));
            }
        }
    }

    /**
     * Commands only accessible to moderators and administrators.
     * @param command The command that was entered.
     * @param blocks The associated string blocks after the command.
     */

    private handleModeratorCommands(command: string, blocks: string[]): void {
        if (!this.player.isMod() && !this.player.isAdmin()) return;

        switch (command) {
            case 'mute':
            case 'ban': {
                let duration = parseInt(blocks.shift()!),
                    targetName = blocks.join(' ');

                if (!duration || !targetName)
                    return this.player.notify(
                        'Malformed command, expected /ban(mute) [duration] [username]'
                    );

                let user: Player = this.world.getPlayerByName(targetName);

                if (!user)
                    return this.player.notify(`Could not find player with name: ${targetName}.`);

                // Moderators can only mute/ban people within certain limits.
                if (this.player.isMod()) {
                    if (command === 'mute' && duration > 168) duration = 168;
                    if (command === 'ban' && duration > 72) duration = 72;
                }

                // Convert hours to milliseconds.
                duration *= 60 * 60 * 1000;

                let timeFrame = Date.now() + duration;

                if (command === 'mute') {
                    user.mute = timeFrame;
                    user.save();

                    this.player.notify(`${user.username} has been muted for ${duration} hours.`);
                } else if (command === 'ban') {
                    user.ban = timeFrame;

                    user.connection.sendUTF8('ban');
                    user.connection.close('banned');

                    this.player.notify(`${user.username} has been banned for ${duration} hours.`);
                }

                return;
            }

            case 'unmute': {
                let uTargetName = blocks.join(' '),
                    uUser = this.world.getPlayerByName(uTargetName);

                if (!uTargetName) return this.player.notify(`Player ${uTargetName} not found.`);

                uUser.mute = Date.now() - 3600;

                uUser.save();

                this.player.notify(`${uUser.username} has been unmuted.`);

                return;
            }

            case 'kick':
            case 'forcekick': {
                let username = blocks.join(' ');

                if (!username)
                    return this.player.notify(`Malformed command, expected /kick username`);

                let player = this.world.getPlayerByName(username);

                if (!player)
                    return this.player.notify(`Could not find player with name: ${username}`);

                player.connection.close(
                    `${this.player.username} kicked ${username}`,
                    command === 'forcekick'
                );

                break;
            }
        }
    }

    /**
     * The commands only accessible to administrators.
     * @param command The command that was entered.
     * @param blocks The associated string blocks after the command.
     */

    private handleAdminCommands(command: string, blocks: string[]): void {
        if (!this.player.isAdmin()) return;

        let username: string,
            player: Player,
            x: number,
            y: number,
            instance: string,
            target: string,
            key: string,
            entity: Character,
            targetEntity: Character,
            questKey: string,
            quest: Quest,
            achievementKey: string,
            achievement: Achievement,
            region: Region,
            item: Item;

        switch (command) {
            case 'spawn': {
                let key = blocks.shift(),
                    count = parseInt(blocks.shift()!);

                if (!key) return;

                if (!count) count = 1;

                item = new Item(key, -1, -1, true, 1);

                if (!item.exists) return this.player.notify(`No item with key ${key} exists.`);

                item.count = count;

                this.player.inventory.add(item);

                return;
            }

            case 'take': {
                let index = parseInt(blocks.shift()!),
                    container = blocks.shift()!,
                    username = blocks.join(' ');

                if (!index || !username)
                    return this.player.notify(
                        'Invalid command, usage /take [index] [container=bank/inventory] [username]'
                    );

                let player = this.world.getPlayerByName(username);

                if (!player) return this.player.notify(`Player ${username} not found.`);

                let containerType = container === 'inventory' ? player.inventory : player.bank,
                    slot = containerType.get(index);

                if (!slot.key)
                    return this.player.notify(`Player ${username} has no item at index ${index}.`);

                containerType.remove(index, slot.count);

                this.player.notify(`Took ${slot.count}x ${slot.key} from ${username}.`);

                return;
            }

            case 'takeitem': {
                let key = blocks.shift(),
                    count = parseInt(blocks.shift()!),
                    container = blocks.shift()!,
                    username = blocks.join(' ');

                if (!key || !username || (container !== 'inventory' && container !== 'bank'))
                    return this.player.notify(
                        'Invalid command, usage /takeitem [key] [count] [container=bank/inventory] [username]'
                    );

                let player = this.world.getPlayerByName(username);

                if (!player) return this.player.notify(`Player ${username} not found.`);

                let containerType = container === 'inventory' ? player.inventory : player.bank;

                containerType.removeItem(key, count);

                this.player.notify(`Took ${count}x ${key} from ${username}.`);

                return;
            }

            case 'copybank':
            case 'copyinventory': {
                let username = blocks.join(' ');

                if (!username)
                    return this.player.notify('Invalid command, usage /copybank [username]');

                let player = this.world.getPlayerByName(username);

                if (!player) return this.player.notify(`Player ${username} is not online.`);

                if (command === 'copybank') {
                    this.player.bank.empty();

                    player.bank.forEachSlot((slot) =>
                        this.player.bank.add(this.player.bank.getItem(slot))
                    );
                } else {
                    this.player.inventory.empty();

                    player.inventory.forEachSlot((slot) =>
                        this.player.inventory.add(this.player.inventory.getItem(slot))
                    );
                }

                this.player.notify(`Copied ${username}'s ${command} to your ${command}.`);
            }

            case 'drop': {
                let key = blocks.shift(),
                    count = parseInt(blocks.shift()!);

                if (!key) return;

                if (!count) count = 1;

                this.world.entities.spawnItem(key, this.player.x, this.player.y, true, count);
            }

            case 'remove': {
                let key = blocks.shift(),
                    count = parseInt(blocks.shift()!);

                if (!key || !count) return;

                this.player.inventory.removeItem(key, count);

                return;
            }

            case 'empty': {
                return this.player.inventory.empty();
            }

            case 'notify': {
                this.player.notify('Hello!!!');

                return;
            }

            case 'teleport': {
                let x = parseInt(blocks.shift()!),
                    y = parseInt(blocks.shift()!),
                    withAnimation = parseInt(blocks.shift()!);

                if (x && y) this.player.teleport(x, y, !!withAnimation);

                return;
            }

            case 'teletome': {
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);

                player?.teleport(this.player.x, this.player.y);

                return;
            }

            case 'teleto': {
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);

                if (player) this.player.teleport(player.x, player.y);

                return;
            }

            case 'nohit':
            case 'invincible': {
                this.player.invincible = !this.player.invincible;

                if (this.player.invincible) this.player.notify('You are now invincible.');
                else this.player.notify('You are no longer invincible.');

                return;
            }

            case 'mob': {
                target = blocks.shift()!;

                if (!target) return this.player.notify('No mob specified.');

                this.entities.spawnMob(target, this.player.x, this.player.y);

                return;
            }

            case 'allattack': {
                region = this.world.map.regions.get(this.player.region);
                target = blocks.shift()!;

                if (!target)
                    return this.player.notify(
                        `Invalid command. Usage: /allattack [target_instance]`
                    );

                if (!region) return this.player.notify('Bro what.');

                targetEntity = this.entities.get(target) as Character;

                if (!targetEntity) return;

                region.forEachEntity((entity: Entity) => {
                    if (!entity.isMob() || entity.instance === target) return;

                    entity.combat.attack(targetEntity);
                });

                break;
            }

            case 'pointer': {
                if (blocks.length > 1) {
                    let posX = parseInt(blocks.shift()!),
                        posY = parseInt(blocks.shift()!);

                    if (!posX || !posY) return;

                    this.player.send(
                        new Pointer(Opcodes.Pointer.Location, {
                            id: this.player.instance,
                            x: posX,
                            y: posY
                        })
                    );
                } else {
                    let instance = blocks.shift()!;

                    if (!instance) return;

                    this.player.send(
                        new Pointer(Opcodes.Pointer.Entity, {
                            id: instance
                        })
                    );
                }

                return;
            }

            case 'teleall': {
                this.entities.forEachPlayer((player: Player) => {
                    player.teleport(this.player.x, this.player.y);
                });

                return;
            }

            case 'getregion': {
                this.player.notify(`Current Region: ${this.player.region}`);
                return;
            }

            case 'debug': {
                this.player.send(new Command({ command: 'debug' }));

                return;
            }

            case 'addexp':
            case 'addexperience': {
                key = blocks.shift()!;
                x = parseInt(blocks.shift()!);

                if (!key || !x) return;

                key = key.charAt(0).toUpperCase() + key.slice(1);

                this.player.skills
                    .get(Modules.Skills[key as keyof typeof Modules.Skills])
                    ?.addExperience(x);

                return;
            }

            case 'setlevel': {
                key = blocks.shift()!;
                x = parseInt(blocks.shift()!);
                username = blocks.join(' ');

                if (!username || !key || !x)
                    return this.player.notify(
                        'Malformed command, expected /setlevel [skill] [level] [username]'
                    );

                player = this.world.getPlayerByName(username);

                if (!player) return this.player.notify(`Player ${username} is not online.`);

                key = key.charAt(0).toUpperCase() + key.slice(1);

                let skill = player.skills.get(Modules.Skills[key as keyof typeof Modules.Skills]);

                if (!skill) return this.player.notify('Invalid skill.');

                if (x < skill.level) {
                    skill.setExperience(0);
                    skill.addExperience(0);
                } else skill.addExperience(Formulas.levelsToExperience(skill.level, x));

                return;
            }

            case 'resetskills': {
                // Skills aren't meant to go backwards so you gotta sync and stuff lmao.
                this.player.skills.forEachSkill((skill: Skill) => {
                    skill.setExperience(0);
                    skill.addExperience(0);
                });
                this.player.skills.sync();
                break;
            }

            case 'max': {
                this.player.skills.forEachSkill((skill: Skill) => {
                    skill.setExperience(0);
                    skill.addExperience(669_420_769);
                });
                break;
            }

            case 'attackrange': {
                log.info(this.player.attackRange);
                return;
            }

            case 'resetregions': {
                log.info('Resetting regions...');

                this.player.regionsLoaded = [];
                this.player.updateRegion();

                return;
            }

            case 'clear': {
                this.player.inventory.forEachSlot((slot) => {
                    this.player.inventory.remove(slot.index, slot.count);
                });

                break;
            }

            case 'timeout': {
                this.player.connection.reject('timeout', true);

                break;
            }

            case 'togglepvp': {
                this.entities.forEachPlayer((player: Player) => {
                    player.updatePVP(true);
                });

                break;
            }

            case 'ms': {
                let movementSpeed = parseInt(blocks.shift()!);

                if (!movementSpeed) {
                    this.player.notify('No movement speed specified.');
                    return;
                }

                if (movementSpeed < 75)
                    // Just to not break stuff.
                    movementSpeed = 75;

                this.player.overrideMovementSpeed = movementSpeed;

                break;
            }

            case 'popup': {
                this.player.popup(
                    'New Quest Found!',
                    '@blue@New @darkblue@quest @green@has@red@ been discovered!'
                );

                break;
            }

            case 'resetquests': {
                this.player.quests.forEachQuest((quest: Quest) => quest.setStage(0));
                break;
            }

            case 'resetquest': {
                key = blocks.shift()!;

                if (!key) return this.player.notify('No quest specified.');

                this.player.quests.get(key)?.setStage(0);
                break;
            }

            case 'resetachievements': {
                this.player.achievements.forEachAchievement((achievement) =>
                    achievement.setStage(0)
                );

                this.player.updateRegion();

                break;
            }

            case 'movenpc': {
                instance = blocks.shift()!;
                x = parseInt(blocks.shift()!);
                y = parseInt(blocks.shift()!);

                if (!instance)
                    return this.player.notify(`Malformed command, expected /movenpc instance x y`);

                entity = this.entities.get(instance) as Character;

                if (!entity) return this.player.notify(`Entity not found.`);

                if (entity.isMob()) entity.move(x, y);

                break;
            }

            case 'nvn': {
                // NPC vs NPC (specify two instances)
                instance = blocks.shift()!;
                target = blocks.shift()!;

                if (!instance || !target)
                    return this.player.notify(`Malformed command, expected /nvn instance target`);

                entity = this.entities.get(instance) as Character;
                targetEntity = this.entities.get(target) as Character;

                if (!entity || !targetEntity)
                    return this.player.notify(`Could not find entity instances specified.`);

                entity.combat.attack(targetEntity);

                this.player.notify(`${entity.name} is attacking ${targetEntity.name}`);

                break;
            }

            case 'kill': {
                username = blocks.join(' ');

                if (!username)
                    return this.player.notify(
                        `Malformed command, expected /kill username/instance`
                    );

                player = this.world.getPlayerByName(username);

                if (player) player.hit(player.hitPoints.getHitPoints());

                targetEntity = this.entities.get(username) as Character;

                if (targetEntity) targetEntity.hit(targetEntity.hitPoints.getHitPoints());

                break;
            }

            case 'finishquest': {
                questKey = blocks.shift()!;

                if (!questKey)
                    return this.player.notify(`Malformed command, expected /finishquest questKey`);

                quest = this.player.quests.get(questKey);

                if (quest) quest.setStage(9999);
                else this.player.notify(`Could not find quest with key: ${questKey}`);

                break;
            }

            case 'finishachievement': {
                achievementKey = blocks.shift()!;

                if (!achievementKey)
                    return this.player.notify(
                        `Malformed command, expected /finishachievement achievementKey`
                    );

                achievement = this.player.achievements.get(achievementKey);

                if (achievement) achievement.finish();
                else this.player.notify(`Could not find achievement with key: ${achievementKey}`);

                break;
            }

            case 'finishachievements': {
                return this.player.achievements.forEachAchievement((achievement) =>
                    achievement.finish()
                );
            }

            case 'poison': {
                instance = blocks.shift()!;

                if (instance) {
                    log.debug('Poisoning entity...');

                    entity = this.entities.get(instance) as Character;

                    if (!entity)
                        return this.player.notify(
                            `Could not find entity with instance: ${instance}`
                        );

                    if (!entity.isMob() && !entity.isPlayer())
                        this.player.notify('That entity cannot be poisoned.');

                    if (entity.poison) {
                        entity.setPoison();
                        this.player.notify('Entity has been cured of poison.');
                    } else {
                        entity.setPoison(0);
                        this.player.notify('Entity has been poisoned.');
                    }
                } else {
                    log.debug('Poisoning player.');

                    if (this.player.poison) {
                        this.player.setPoison();
                        this.player.notify('Your poison has been cured!');
                    } else {
                        this.player.setPoison(0); // 0 === Modules.PoisonType.Venom
                        this.player.notify('You have been poisoned!');
                    }
                }

                break;
            }

            case 'poisonarea': {
                region = this.world.map.regions.get(this.player.region);

                if (!region) this.player.notify('Bro something went badly wrong wtf.');

                this.player.notify(`All entities in the region will be nuked with poison.`);

                region.forEachEntity((entity: Entity) => {
                    if (!entity.isMob() && !entity.isPlayer()) return;

                    (entity as Character).setPoison(0);
                });

                break;
            }

            case 'roam': {
                region = this.world.map.regions.get(this.player.region);

                if (!region) this.player.notify('Bro something went badly wrong wtf.');

                this.player.notify(`All mobs in the region will now roam!`);

                region.forEachEntity((entity: Entity) => {
                    if (!entity.isMob()) return;

                    entity.roamingCallback?.();
                });

                break;
            }

            case 'talk': {
                instance = blocks.shift()!;

                if (!instance)
                    return this.player.notify(`Malformed command, expected /talk instance`);

                targetEntity = this.entities.get(instance) as Character;

                if (!targetEntity)
                    return this.player.notify(`Could not find entity with instance: ${instance}`);

                (targetEntity as Mob).talkCallback?.('This is a test talking message lol');

                break;
            }

            case 'distance': {
                x = parseInt(blocks.shift()!);
                y = parseInt(blocks.shift()!);

                if (!x || !y)
                    return this.player.notify(`Malformed command, expected /distance x y`);

                this.player.notify(
                    `Distance: ${Utils.getDistance(this.player.x, this.player.y, x, y)}`
                );

                break;
            }

            case 'nuke': {
                let all = !!blocks.shift();

                region = this.world.map.regions.get(this.player.region);

                region.forEachEntity((entity: Entity) => {
                    if (!(entity instanceof Character)) return;
                    if (entity.instance === this.player.instance) return;

                    if (!all && entity.isPlayer()) return;

                    entity.deathCallback?.();
                });

                this.player.notify(
                    'Congratulations, you killed everyone, are you happy with yourself?'
                );

                break;
            }

            case 'noclip': {
                this.player.noclip = !this.player.noclip;

                this.player.notify(`Noclip: ${this.player.noclip}`);
                break;
            }

            case 'addability': {
                key = blocks.shift()!;

                if (!key) return this.player.notify(`Malformed command, expected /addability key`);

                this.player.abilities.add(key, 1);
                break;
            }

            case 'setability': {
                key = blocks.shift()!;
                x = parseInt(blocks.shift()!);

                if (!key || !x)
                    return this.player.notify(`Malformed command, expected /setability key level`);

                this.player.abilities.setLevel(key, x);

                break;
            }

            case 'setquickslot': {
                key = blocks.shift()!;
                x = parseInt(blocks.shift()!);

                if (!key || isNaN(x))
                    return this.player.notify(
                        `Malformed command, expected /setquickslot key quickslot`
                    );

                this.player.abilities.setQuickSlot(key, x);
                break;
            }

            case 'resetabilities': {
                return this.player.abilities.reset();
            }

            case 'store': {
                key = blocks.shift()!;

                if (!key) return this.player.notify(`Malformed command, expected /store key`);

                this.player.send(new Store(Opcodes.Store.Open, this.world.stores.serialize(key)));

                this.player.storeOpen = key;

                break;
            }

            case 'aoe': {
                this.player.hit(600, this.player, 2);
                break;
            }

            case 'bank': {
                this.player.send(new NPC(Opcodes.NPC.Bank, this.player.bank.serialize()));
                break;
            }

            case 'openbank': {
                let username = blocks.shift()!;

                if (!username)
                    return this.player.notify(`Malformed command, expected /openbank username`);

                let player = this.world.getPlayerByName(username);

                if (!player) return this.player.notify(`Could not find player: ${username}`);

                this.player.send(new NPC(Opcodes.NPC.Bank, player.bank.serialize()));

                break;
            }

            case 'setrank': {
                let rankText = blocks.shift()!;

                username = blocks.join(' ');

                if (!username || !rankText)
                    return this.player.notify(`Malformed command, expected /setrank username rank`);

                player = this.world.getPlayerByName(username);

                if (!player)
                    return this.world.database.setRank(
                        username,
                        Modules.Ranks[rankText as keyof typeof Modules.Ranks]
                    );

                let rank = Modules.Ranks[rankText as keyof typeof Modules.Ranks];

                if (isNaN(rank)) return this.player.notify(`Invalid rank: ${rankText}`);

                player.setRank(rank);
                player.sync();

                break;
            }

            case 'setpet': {
                let key = blocks.shift()!;

                if (!key) return this.player.notify(`Malformed command, expected /setpet key`);

                this.player.setPet(key);
            }
        }
    }
}
