import _ from 'lodash';

import config from '@kaetram/common/config';
import { Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Entities from '../controllers/entities';
import GlobalObjects from '../controllers/globalobjects';
import Shops from '../controllers/shops';
import Grids from './map/grids';
import Map from './map/map';
import API from '../network/api';
import Discord from '../network/discord';
import Messages, { Packet } from '../network/messages';
import Network from '../network/network';
import Mobs from '../util/mobs';
import Character from './entity/character/character';

import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Mob from './entity/character/mob/mob';
import type Player from './entity/character/player/player';
import type Entity from './entity/entity';

type ConnectionCallback = (connection: Connection) => void;

interface WorldPacket {
    [key: string]: unknown;
    message: Packet;
}

export default class World {
    private maxPlayers = config.maxPlayers;
    private updateTime = config.updateTime;
    // private debug = false;
    public allowConnections = false;

    // private loadedRegions = false;
    public ready = false;

    public map!: Map;
    public api!: API;
    public shops!: Shops;
    public entities!: Entities;
    public network!: Network;
    public discord!: Discord;
    public globalObjects!: GlobalObjects;

    public connectionCallback?: ConnectionCallback;
    public populationCallback?(): void;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.map = new Map(this);
        this.api = new API(this);
        this.shops = new Shops(this);
        this.discord = new Discord(this);
        this.entities = new Entities(this);
        this.network = new Network(this);
        this.globalObjects = new GlobalObjects(this);

        this.ready = true;

        this.tick();

        log.info('******************************************');
    }

    private async tick(): Promise<void> {
        let update = 1000 / this.updateTime,
            setIntervalAsync: (fn: () => Promise<void>, ms: number) => void = (fn, ms) =>
                fn().then(() => setTimeout(() => setIntervalAsync(fn, ms), ms));

        setIntervalAsync(async () => {
            this.network.parse();
            this.map.regions.parse();
        }, update);

        if (!config.hubEnabled) return;

        await import('@kaetram/hub');

        if (!config.apiEnabled) log.error('Server is in hub-mode but API is not enabled!');

        setIntervalAsync(async () => {
            this.api.pingHub();
        }, config.hubPing);
    }

    /****************************
     * Entity related functions *
     ****************************/

    public kill(character: Character): void {
        character.applyDamage(character.hitPoints);

        this.push(Opcodes.Push.Regions, [
            {
                regionId: character.region,
                message: new Messages.Points({
                    id: character.instance,
                    hitPoints: character.getHitPoints(),
                    mana: null
                })
            },
            {
                regionId: character.region,
                message: new Messages.Despawn(character.instance)
            }
        ]);

        this.handleDeath(character, true);
    }

    public handleDamage(
        attacker: Character | undefined,
        target: Character | undefined,
        damage: number
    ): void {
        if (!attacker || !target || isNaN(damage) || target.invincible) return;

        if (target.type === 'player' && target.hitCallback) target.hitCallback(attacker, damage);

        // Stop screwing with this - it's so the target retaliates.

        target.hit(attacker);
        target.applyDamage(damage, attacker);

        this.push(Opcodes.Push.Regions, {
            regionId: target.region,
            message: new Messages.Points({
                id: target.instance,
                hitPoints: target.getHitPoints(),
                mana: null
            })
        });

        // If target has died...
        if (target.getHitPoints() < 1) {
            let player = attacker as Player;

            if (target.type === 'mob') player.addExperience(Mobs.getXp(target.id));

            if (player.type === 'player') player.killCharacter(target);

            target.combat.forEachAttacker((attacker) => {
                attacker.removeTarget();
            });

            this.push(Opcodes.Push.Regions, [
                {
                    regionId: target.region,
                    message: new Messages.Combat(Opcodes.Combat.Finish, {
                        attackerId: attacker.instance,
                        targetId: target.instance
                    })
                },
                {
                    regionId: target.region,
                    message: new Messages.Despawn(target.instance)
                }
            ]);

            this.handleDeath(target, false, attacker);
        }
    }

    public handleDeath(character: Character, ignoreDrops = false, lastAttacker?: Character): void {
        if (!character) return;

        if (character.type === 'mob') {
            let mob = character as Mob,
                deathX = mob.x,
                deathY = mob.y;

            if (lastAttacker) mob.lastAttacker = lastAttacker;

            mob.deathCallback?.();

            this.entities.remove(mob);

            mob.dead = true;

            mob.destroy();

            mob.combat.stop();

            if (!ignoreDrops) {
                let drop = mob.getDrop();

                if (drop) this.entities.dropItem(drop.id, drop.count, deathX, deathY);
            }
        } else if (character.type === 'player') {
            let player = character as Player;

            player.die();
        }
    }

    public push(type: Opcodes.Push, info: WorldPacket | WorldPacket[]): void {
        if (_.isArray(info)) {
            _.each(info, (i) => {
                this.push(type, i);
            });

            return;
        }

        if (!info.message) {
            log.info('No message found whilst attempting to push.');
            log.info(info);
            return;
        }

        switch (type) {
            case Opcodes.Push.Broadcast:
                this.network.pushBroadcast(info.message);

                break;

            case Opcodes.Push.Selectively:
                this.network.pushSelectively(info.message, info.ignores as string[]);

                break;

            case Opcodes.Push.Player:
                this.network.pushToPlayer(info.player as Player, info.message);

                break;

            case Opcodes.Push.Players:
                this.network.pushToPlayers(info.players as string[], info.message);

                break;

            case Opcodes.Push.Region:
                this.network.pushToRegion(
                    info.regionId as number,
                    info.message,
                    info.ignoreId as string
                );

                break;

            case Opcodes.Push.Regions:
                this.network.pushToAdjacentRegions(
                    info.regionId as number,
                    info.message,
                    info.ignoreId as string
                );

                break;

            case Opcodes.Push.NameArray:
                this.network.pushToNameArray(info.names as string[], info.message);

                break;

            case Opcodes.Push.OldRegions:
                this.network.pushToOldRegions(info.player as Player, info.message);

                break;
        }
    }

    public globalMessage(
        source: string,
        message: string,
        colour?: string,
        isGlobal = false,
        withBubble = false
    ): void {
        this.push(Opcodes.Push.Broadcast, {
            message: new Messages.Chat({
                name: source,
                text: message,
                colour,
                isGlobal,
                withBubble
            })
        });
    }

    public cleanCombat(character: Character): void {
        this.entities.forEachEntity((entity: Entity) => {
            if (entity.instance !== character.instance) return;

            if (entity instanceof Character && entity.combat.hasAttacker(entity))
                entity.combat.removeAttacker(entity);
        });
    }

    public isOnline(username: string): boolean {
        return this.entities.isOnline(username);
    }

    public getPlayerByName(username: string): Player {
        return this.entities.getPlayer(username) as Player;
    }

    public isFull(): boolean {
        return this.getPopulation() >= this.maxPlayers;
    }

    public getGrids(): Grids {
        return this.map.grids;
    }

    public getPopulation(): number {
        return _.size(this.entities.players);
    }

    public onConnection(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
    }

    public onPopulationChange(callback: () => void): void {
        this.populationCallback = callback;
    }
}
