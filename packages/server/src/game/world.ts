import _ from 'lodash';

import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Entities from '../controllers/entities';
import GlobalObjects from '../controllers/globalobjects';
import Shops from '../controllers/shops';
import Grids from './map/grids';
import Map from './map/map';
import API from '../network/api';
import Network from '../network/network';
import Character from './entity/character/character';

import { PacketType } from '@kaetram/common/network/modules';
import { Chat, Combat, Despawn, Points } from '../network/packets';
import Packet from '../network/packet';

import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Mob from './entity/character/mob/mob';
import type Player from './entity/character/player/player';
import type Entity from './entity/entity';

export interface PacketData {
    packet: Packet;
    player?: Player;
    ignore?: string;
    region?: number;
}

type ConnectionCallback = (connection: Connection) => void;

export default class World {
    public map!: Map;
    public api!: API;
    public shops!: Shops;
    public entities!: Entities;
    public network!: Network;
    public discord!: Discord;
    public globalObjects!: GlobalObjects;

    private maxPlayers = config.maxPlayers;

    public connectionCallback?: ConnectionCallback;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.map = new Map(this);
        this.api = new API(this);
        this.shops = new Shops(this);
        this.discord = new Discord();
        this.entities = new Entities(this);
        this.network = new Network(this);
        this.globalObjects = new GlobalObjects(this);

        this.discord.onMessage(this.globalMessage.bind(this));

        this.onConnection(this.network.handleConnection.bind(this.network));

        log.info('******************************************');

        this.tick();
    }

    /**
     * A `tick` is a call that occurs every `config.updateTime` milliseconds.
     * This function underlines how fast (or how slow) we parse through packets.
     */

    private async tick(): Promise<void> {
        let setIntervalAsync: (fn: () => Promise<void>, ms: number) => void = (fn, ms) =>
            fn().then(() => setTimeout(() => setIntervalAsync(fn, ms), ms));

        setIntervalAsync(async () => {
            this.network.parse();
            this.map.regions.parse();
        }, 1000 / config.updateTime);

        if (!config.hubEnabled) return;
        if (!config.apiEnabled) log.error('Server is in hub-mode but API is not enabled!');

        setIntervalAsync(async () => {
            this.api.pingHub();
        }, config.hubPing);
    }

    /**
     * All packets are sent through this function. Here we organize who we send the packet to,
     * and perform further data checking (in the future if necessary).
     * @param packetType The method we are sending the packet.
     * @param data The data containing information about who the packet is sent to.
     */

    public push(packetType: number, data: PacketData): void {
        switch (packetType) {
            case PacketType.Broadcast:
                return this.network.broadcast(data.packet);

            case PacketType.Player:
                return this.network.send(data.player as Player, data.packet);

            case PacketType.Region:
                return this.network.sendToRegion(data.region as number, data.packet, data.ignore);

            case PacketType.Regions:
                return this.network.sendToSurroundingRegions(
                    data.region as number,
                    data.packet,
                    data.ignore
                );
        }
    }

    /****************************
     * Entity related functions *
     ****************************/

    public kill(character: Character): void {
        character.hitPoints.decrement(character.hitPoints.getHitPoints());

        this.push(Modules.PacketType.Regions, {
            region: character.region,
            packet: new Points({
                id: character.instance,
                hitPoints: character.getHitPoints(),
                mana: null
            })
        });

        this.push(Modules.PacketType.Regions, {
            region: character.region,
            packet: new Despawn(character.instance)
        });

        this.handleDeath(character, true);
    }

    public handleDamage(attacker: Character, target: Character, damage: number): void {
        if (!attacker || !target || isNaN(damage) || target.invincible) return;

        // Stop screwing with this - it's so the target retaliates.

        target.hit(attacker, damage);

        this.push(Modules.PacketType.Regions, {
            region: target.region,
            packet: new Points({
                id: target.instance,
                hitPoints: target.getHitPoints(),
                mana: null
            })
        });

        // If target has dieded...
        if (target.getHitPoints() < 1) {
            // All of this has to get redone anyway lol
            let player = attacker as unknown as Player;

            if (target.isMob()) player.addExperience((target as Mob).experience);

            if (player.isPlayer()) player.killCharacter(target);

            target.combat.forEachAttacker((attacker) => {
                attacker.removeTarget();
            });

            this.push(Modules.PacketType.Regions, {
                region: target.region,
                packet: new Combat(Opcodes.Combat.Finish, {
                    attackerId: attacker.instance,
                    targetId: target.instance
                })
            });

            this.push(Modules.PacketType.Regions, {
                region: target.region,
                packet: new Despawn(target.instance)
            });

            this.handleDeath(target, false, attacker);
        }
    }

    public handleDeath(character: Character, ignoreDrops = false, lastAttacker?: Character): void {
        if (!character) return;

        if (character.isMob()) {
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

                if (drop) this.entities.spawnItem(drop.key, deathX, deathY, true, drop.count);
            }
        } else if (character.isPlayer()) {
            let player = character as Player;

            player.die();
        }
    }

    /**
     * Broadcasts a chat packet to all the players logged in.
     * @param source Who is sending the message.
     * @param message The contents of the broadcast.
     * @param colour The message's colour.
     * @param isGlobal Whether we display the chat as a global message.
     * @param withBubble Whether to display a bubble above the player.
     */

    public globalMessage(
        source: string,
        message: string,
        colour?: string,
        isGlobal = false,
        withBubble = false
    ): void {
        this.push(Modules.PacketType.Broadcast, {
            packet: new Chat({
                name: source,
                text: message,
                colour,
                isGlobal,
                withBubble
            })
        });
    }

    /**
     * Iterates through all the entities and removes the `character`
     * parameter from their attackers list. We call this function
     * when the `character` logs out or dies.
     * @param character The character we are removing from other entity's character.
     */

    public cleanCombat(character: Character): void {
        this.entities.forEachEntity((entity: Entity) => {
            if (entity.instance !== character.instance) return;

            if (entity instanceof Character && entity.combat.hasAttacker(character))
                entity.combat.removeAttacker(character);
        });
    }

    /**
     * Checks if the user is logged in.
     * @param username The username of the player we are checking.
     * @returns Boolean of whether user is online.
     */

    public isOnline(username: string): boolean {
        return !!this.getPlayerByName(username);
    }

    /**
     * Grabs and returns a player instance based on its username.
     * @param username The username of the player.
     * @returns The player instance.
     */

    public getPlayerByName(username: string): Player {
        return this.entities.getPlayer(username) as Player;
    }

    // Check to see if the world is full.
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
}
