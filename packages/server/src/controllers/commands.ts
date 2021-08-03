import { Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Messages from '../network/messages';

import type Achievement from '../game/entity/character/player/achievement';
import type Player from '../game/entity/character/player/player';

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

        if (this.player.rights > 0) this.handleModeratorCommands(command, blocks);

        if (this.player.rights > 1) this.handleAdminCommands(command, blocks);
    }

    private handlePlayerCommands(command: string, blocks: string[]): void {
        switch (command) {
            case 'players': {
                let population = this.world.getPopulation(),
                    singular = population === 1;

                if (this.player.rights > 1)
                    this,
                        this.entities.forEachPlayer((player: Player) => {
                            this.player.notify(player.username);
                        });

                this.player.notify(
                    `There ${singular ? 'is' : 'are'} currently ${population} ${
                        singular ? 'person' : 'people'
                    } online.`
                );

                return;
            }

            case 'tutstage':
                log.info(this.player.getTutorial().stage);

                return;

            case 'coords':
                this.player.send(
                    new Messages.Notification(Opcodes.Notification.Text, {
                        message: `x: ${this.player.x} y: ${this.player.y}`
                    })
                );

                return;

            case 'progress': {
                let tutorialQuest = this.player.getTutorial();

                this.player.send(
                    new Messages.Quest(Opcodes.Quest.Progress, {
                        id: tutorialQuest.id,
                        stage: tutorialQuest.stage
                    })
                );

                return;
            }

            case 'global':
                this.world.globalMessage(
                    this.player.username,
                    blocks.join(' '),
                    'rgba(191, 191, 63, 1.0)',
                    true,
                    false
                );

                return;

            case 'region':
                log.info(this.player.region);
                return;

            case 'getintroduction':
                log.info(this.player.quests.getQuest(0)!.getStage());
                return;

            case 'resetintro': {
                let introduction = this.player.quests.getQuest(0)!;

                introduction.setStage(0);
                introduction.clearPointers();
                introduction.update();
                introduction.updatePointers();

                this.player.updateRegion();
                this.player.save();

                return;
            }

            case 'pm':
            case 'msg': {
                let otherPlayer = blocks.shift()!,
                    message = blocks.join(' ');

                this.player.sendMessage(otherPlayer, message);

                return;
            }

            case 'ping':
                this.player.pingTime = Date.now();
                this.player.send(new Messages.Network(Opcodes.Network.Ping));

                break;
        }
    }

    private handleModeratorCommands(command: string, blocks: string[]): void {
        switch (command) {
            case 'mute':
            case 'ban': {
                let duration = parseInt(blocks.shift()!),
                    targetName = blocks.join(' '),
                    user: Player = this.world.getPlayerByName(targetName);

                if (!user) return;

                if (!duration) duration = 24;

                let timeFrame = Date.now() + duration * 60 * 60;

                if (command === 'mute') user.mute = timeFrame;
                else if (command === 'ban') {
                    user.ban = timeFrame;
                    user.save();

                    user.connection.sendUTF8('ban');
                    user.connection.close('banned');
                }

                user.save();

                return;
            }

            case 'unmute': {
                let uTargetName = blocks.join(' '),
                    uUser = this.world.getPlayerByName(uTargetName);

                if (!uTargetName) return;

                uUser.mute = Date.now() - 3600;

                uUser.save();

                return;
            }
        }
    }

    private handleAdminCommands(command: string, blocks: string[]): void {
        let username: string, player: Player;

        switch (command) {
            case 'spawn': {
                let spawnId = parseInt(blocks.shift()!),
                    count = parseInt(blocks.shift()!),
                    ability = parseInt(blocks.shift()!),
                    abilityLevel = parseInt(blocks.shift()!);

                if (!spawnId || !count) return;

                this.player.inventory.add({
                    id: spawnId,
                    count,
                    ability: ability || -1,
                    abilityLevel: abilityLevel || -1
                });

                return;
            }

            case 'maxhealth':
                this.player.notify(
                    `Max health is ${this.player.playerHitPoints.getMaxHitPoints()}`
                );

                return;

            case 'ipban':
                return;

            case 'drop': {
                let id = parseInt(blocks.shift()!),
                    dCount = parseInt(blocks.shift()!);

                if (!id) return;

                if (!dCount) dCount = 1;

                this.entities.dropItem(id, dCount, this.player.x, this.player.y);

                return;
            }

            case 'ghost':
                this.player.equip('ghost', 1, -1, -1);

                return;

            case 'notify':
                this.player.notify('Hello!!!');

                return;

            case 'teleport': {
                let x = parseInt(blocks.shift()!),
                    y = parseInt(blocks.shift()!),
                    withAnimation = parseInt(blocks.shift()!);

                if (x && y) this.player.teleport(x, y, false, !!withAnimation);

                return;
            }

            case 'teletome':
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);

                player?.teleport(this.player.x, this.player.y);

                return;

            case 'teleto':
                username = blocks.join(' ');
                player = this.world.getPlayerByName(username);

                if (player) this.player.teleport(player.x, player.y);

                return;

            case 'nohit':
                log.info('invincinil');

                this.player.invincible = !this.player.invincible;

                return;

            case 'mob': {
                let npcId = parseInt(blocks.shift()!);

                this.entities.spawnMob(npcId, this.player.x, this.player.y);

                return;
            }

            case 'pointer':
                if (blocks.length > 1) {
                    let posX = parseInt(blocks.shift()!),
                        posY = parseInt(blocks.shift()!);

                    if (!posX || !posY) return;

                    this.player.send(
                        new Messages.Pointer(Opcodes.Pointer.Location, {
                            id: this.player.instance,
                            x: posX,
                            y: posY
                        })
                    );
                } else {
                    let instance = blocks.shift()!;

                    if (!instance) return;

                    this.player.send(
                        new Messages.Pointer(Opcodes.Pointer.NPC, {
                            id: instance
                        })
                    );
                }

                return;

            case 'teleall':
                this.entities.forEachPlayer((player: Player) => {
                    player.teleport(this.player.x, this.player.y);
                });

                return;

            case 'attackaoe': {
                let radius = parseInt(blocks.shift()!);

                if (!radius) radius = 1;

                this.player.combat.dealAoE(radius);

                return;
            }

            case 'addexp': {
                let exp = parseInt(blocks.shift()!);

                if (!exp) return;

                this.player.addExperience(exp);

                return;
            }

            case 'region': {
                let tileX = parseInt(blocks.shift()!),
                    tileY = parseInt(blocks.shift()!),
                    tileInfo = parseInt(blocks.shift()!);

                if (!tileX || !tileY) return;

                let tileIndex = this.world.region.gridPositionToIndex(tileX - 1, tileY);

                log.info(`Sending Tile: ${tileIndex}`);

                this.world.push(Opcodes.Push.Player, {
                    player: this.player,
                    message: new Messages.Region(Opcodes.Region.Modify, {
                        index: tileIndex,
                        data: tileInfo
                    })
                });

                return;
            }

            case 'instance':
                this.world.region.createInstance(this.player, this.player.region);
                return;

            case 'checkregion':
                this.player.notify(`Current Region: ${this.player.region}`);
                return;

            case 'deinstance':
                this.world.region.deleteInstance(this.player);
                return;

            case 'debug':
                this.player.send(
                    new Messages.Command({
                        command: 'debug'
                    })
                );
                return;

            case 'addexperience':
                this.player.addExperience(parseInt(blocks.shift()!));
                return;

            case 'attackrange':
                log.info(this.player.attackRange);
                return;

            case 'resetregions':
                log.info('Resetting regions...');

                this.player.regionsLoaded = [];
                this.player.updateRegion();

                return;

            case 'finishQuest':
                this.player.quests.getQuest(1)!.finish();

                break;

            case 'finishAchievement':
                this.player.quests.getAchievement(0)!.finish();

                break;

            case 'finishAllAchievements':
                this.player.quests.forEachAchievement((achievement: Achievement) => {
                    this.player.finishAchievement(achievement.id);
                });

                break;

            case 'resetAchievement': {
                let achievementId = parseInt(blocks.shift()!);

                if (!achievementId) {
                    this.player.notify('Invalid command format. /resetAchievement <achievementId>');
                    return;
                }

                this.player.quests.getAchievement(achievementId)!.setProgress(0);
                this.player.updateRegion();

                break;
            }

            case 'resetAchievements':
                this.player.quests.forEachAchievement((achievement: Achievement) => {
                    achievement.setProgress(0);
                });

                this.player.updateRegion();

                break;

            case 'clear':
                this.player.inventory.forEachSlot((slot) => {
                    if (slot.id !== -1) this.player.inventory.remove(slot.id, slot.count);
                });

                break;

            case 'timeout':
                this.player.timeout();

                break;

            case 'togglepvp':
                this.entities.forEachPlayer((player: Player) => {
                    player.updatePVP(true, true);
                });

                break;

            case 'die':
                this.world.handleDeath(this.player);

                break;

            case 'ms': {
                let movementSpeed = parseInt(blocks.shift()!);

                if (!movementSpeed) {
                    this.player.notify('No movement speed specified.');
                    return;
                }

                if (movementSpeed < 75)
                    // Just to not break stuff.
                    movementSpeed = 75;

                this.player.defaultMovementSpeed = movementSpeed;

                this.player.sync();

                break;
            }

            case 'toggleheal':
                this.player.send(
                    new Messages.Command({
                        command: 'toggleheal'
                    })
                );
                break;

            case 'popup':
                this.player.send(
                    new Messages.Notification(Opcodes.Notification.Popup, {
                        title: 'New Quest Found!',
                        message: 'New quest has been discovered!',
                        colour: '#00000'
                    })
                );

                break;
        }
    }
}
