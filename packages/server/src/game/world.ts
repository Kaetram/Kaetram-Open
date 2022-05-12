import _ from 'lodash';

import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';
import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Entities from '../controllers/entities';
import Stores from '../controllers/stores';
import Grids from './map/grids';
import Map from './map/map';
import API from '../network/api';
import Network from '../network/network';
import Character from './entity/character/character';

import { PacketType } from '@kaetram/common/network/modules';
import { Chat } from '../network/packets';
import Packet from '../network/packet';

import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Player from './entity/character/player/player';
import type Entity from './entity/entity';
import Trees from './globals/trees';

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
    public stores!: Stores;
    public entities!: Entities;
    public network!: Network;
    public discord!: Discord;
    public trees!: Trees;

    private maxPlayers = config.maxPlayers;

    public connectionCallback?: ConnectionCallback;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.map = new Map(this);
        this.api = new API(this);
        this.trees = new Trees(this);
        this.stores = new Stores(this);
        this.discord = new Discord();
        this.entities = new Entities(this);
        this.network = new Network(this);

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

        if (config.hubEnabled) setIntervalAsync(async () => this.api.pingHub(), config.hubPing);
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

    /**
     * Broadcasts a chat packet to all the players logged in.
     * @param source Who is sending the message.
     * @param message The contents of the broadcast.
     * @param colour The message's colour.
     */

    public globalMessage(source: string, message: string, colour = ''): void {
        this.push(Modules.PacketType.Broadcast, {
            packet: new Chat({
                source,
                message,
                colour
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

            // if (entity instanceof Character && entity.combat.hasAttacker(character))
            //     entity.combat.removeAttacker(character);
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
     * Checks if the world is full.
     * @returns True if the number of players is equal to the max players.
     */

    public isFull(): boolean {
        return this.getPopulation() >= this.maxPlayers;
    }

    /**
     * Grabs and returns a player instance based on its username.
     * @param username The username of the player.
     * @returns The player instance.
     */

    public getPlayerByName(username: string): Player {
        return this.entities.getPlayer(username) as Player;
    }

    /**
     * Getter shortcut for the Grids instance from the map.
     * @returns The `Grid` instance.
     */

    public getGrids(): Grids {
        return this.map.grids;
    }

    /**
     * Returns the number of players currently logged in.
     * @returns Number of players logged in.
     */

    public getPopulation(): number {
        return _.size(this.entities.listOfPlayers);
    }

    /**
     * Callback for when a connection is established.
     * @param callback Contains the connection instance.
     */

    public onConnection(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
    }
}
