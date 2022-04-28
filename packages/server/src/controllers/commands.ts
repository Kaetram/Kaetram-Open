import config from '@kaetram/common/config';
import { Opcodes, Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Character from '../game/entity/character/character';
import Mob from '../game/entity/character/mob/mob';
import Item from '../game/entity/objects/item';
import Quest from '../game/entity/character/player/quest/quest';

import type Achievement from '../game/entity/character/player/achievement';
import type Player from '../game/entity/character/player/player';
import { Command, Map, Pointer, Network, Notification } from '../network/packets';

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

            case 'coords':
                this.player.send(
                    new Notification(Opcodes.Notification.Text, {
                        message: `x: ${this.player.x} y: ${this.player.y}`
                    })
                );
                return;

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

            case 'pm':
            case 'msg': {
                let otherPlayer = blocks.shift()!,
                    message = blocks.join(' ');

                this.player.sendMessage(otherPlayer, message);

                return;
            }

            case 'ping':
                this.player.pingTime = Date.now();
                this.player.send(new Network(Opcodes.Network.Ping));
                break;

            case 'resettutorial':
                if (!config.debugging) return;

                this.player.quests.getQuest('tutorial')!.setStage(0);

                this.player.notify('Tutorial has been reset.');
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
        let username: string,
            player: Player,
            x: number,
            y: number,
            instance: string,
            target: string,
            entity: Character,
            targetEntity: Character,
            questKey: string,
            quest: Quest;

        switch (command) {
            case 'spawn': {
                let key = blocks.shift(),
                    count = parseInt(blocks.shift()!),
                    ability = parseInt(blocks.shift()!),
                    abilityLevel = parseInt(blocks.shift()!);

                if (!key || !count) return;

                this.player.inventory.add(
                    new Item(key, -1, -1, true, count, ability, abilityLevel)
                );

                return;
            }

            case 'maxhealth':
                this.player.notify(`Max health is ${this.player.hitPoints.getMaxHitPoints()}`);

                return;

            case 'ipban':
                return;

            case 'ghost':
                //this.player.equip('ghost', 1, -1, -1);

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
                // let npcId = parseInt(blocks.shift()!);

                // this.entities.spawnMob(npcId, this.player.x, this.player.y);

                return;
            }

            case 'pointer':
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

            case 'teleall':
                this.entities.forEachPlayer((player: Player) => {
                    player.teleport(this.player.x, this.player.y);
                });

                return;

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

                let index = this.world.map.coordToIndex(tileX - 1, tileY);

                log.info(`Sending Tile: ${index}`);

                this.player.send(
                    new Map(Opcodes.Map.Modify, {
                        index,
                        data: tileInfo
                    })
                );

                return;
            }

            case 'getregion':
                this.player.notify(`Current Region: ${this.player.region}`);
                return;

            case 'debug':
                this.player.send(new Command({ command: 'debug' }));

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

            case 'clear':
                this.player.inventory.forEachSlot((slot) => {
                    this.player.inventory.remove(slot.index, slot.count);
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
                return this.player.send(new Command({ command: 'toggleheal' }));

            case 'popup':
                this.player.send(
                    new Notification(Opcodes.Notification.Popup, {
                        title: 'New Quest Found!',
                        message: 'New quest has been discovered!',
                        colour: '#00000'
                    })
                );

                break;

            case 'movenpc':
                instance = blocks.shift()!;
                x = parseInt(blocks.shift()!);
                y = parseInt(blocks.shift()!);

                if (!instance)
                    return this.player.notify(`Malformed command, expected /movenpc instance x y`);

                entity = this.entities.get(instance) as Character;

                if (!entity) return this.player.notify(`Entity not found.`);

                console.log(entity.isMob());

                if (entity.isMob()) (entity as Mob).move(x, y);

                break;

            case 'nvn': // NPC vs NPC (specify two instances)
                instance = blocks.shift()!;
                target = blocks.shift()!;

                if (!instance || !target)
                    return this.player.notify(`Malformed command, expected /nvn instance target`);

                entity = this.entities.get(instance) as Character;
                targetEntity = this.entities.get(target) as Character;

                if (!entity || !targetEntity)
                    return this.player.notify(`Could not find entity instances specified.`);

                entity.combat.attack(targetEntity);

                break;

            case 'kill':
                username = blocks.shift()!;

                if (!username)
                    return this.player.notify(`Malformed command, expected /kill username`);

                player = this.world.getPlayerByName(username);

                if (player) player.hit(player.hitPoints.getHitPoints());

                break;

            case 'finishquest':
                questKey = blocks.shift()!;

                if (!questKey)
                    return this.player.notify(`Malformed command, expected /finishquest questKey`);

                quest = this.player.quests.getQuest(questKey);

                if (quest) quest.setStage(9999);
                else this.player.notify(`Could not find quest with key: ${questKey}`);

                break;
        }
    }
}
