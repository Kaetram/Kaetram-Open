import _ from 'lodash-es';

import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';
import log from '@kaetram/common/util/log';

import Trees from './globals/trees';
import Lights from './globals/lights';
import Entities from '../controllers/entities';
import Stores from '../controllers/stores';
import Grids from './map/grids';
import Map from './map/map';
import API from '../network/api';
import Packet from '../network/packet';
import Network from '../network/network';
import Character from './entity/character/character';

import { Modules } from '@kaetram/common/network';
import { PacketType } from '@kaetram/common/network/modules';
import { Chat } from '../network/packets';

import type MongoDB from '../database/mongodb/mongodb';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Player from './entity/character/player/player';
import Pool from '../workers/pool';

export interface PacketData {
    packet: Packet;
    player?: Player;
    ignore?: string;
    region?: number;
}

type ConnectionCallback = (connection: Connection) => void;

export default class World {
    public map: Map;
    public api: API;
    public stores: Stores;
    public trees: Trees;
    public lights: Lights;
    public entities: Entities;
    public network: Network;

    public discord: Discord = new Discord(config.hubEnabled);
    public workerPool: Pool = new Pool(config.threads);

    private maxPlayers = config.maxPlayers;

    public connectionCallback?: ConnectionCallback;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.map = new Map(this);
        this.api = new API(this);
        this.stores = new Stores(this);
        this.trees = new Trees(this);
        this.lights = new Lights(this.map);
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
     * @param noPrefix Whether to skip the `[Global]:` prefix or not.
     */

    public globalMessage(source: string, message: string, colour = '', noPrefix = false): void {
        this.push(Modules.PacketType.Broadcast, {
            packet: new Chat({
                source: noPrefix ? source : `[Global]: ${source}`,
                message,
                colour
            })
        });
    }

    /**
     * Iterates through all the characters in the world and checks whether
     * the `cleanCharacter` is their target. If it is, we remove it.
     * @param cleanCharacter The character that we are removing as target.
     */

    public cleanCombat(cleanCharacter: Character): void {
        this.entities.forEachCharacter((character: Character) => {
            if (!character.hasTarget()) return;

            if (character.target?.instance === cleanCharacter.instance) character.clearTarget();
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
