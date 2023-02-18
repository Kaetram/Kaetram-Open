import Globals from './globals/globals';
import Map from './map/map';
import Minigames from './minigames/minigames';

import Enchanter from '../controllers/enchanter';
import Entities from '../controllers/entities';
import Stores from '../controllers/stores';
import Warps from '../controllers/warps';
import API from '../network/api';
import Network from '../network/network';
import { Chat } from '../network/packets';

import Utils from '@kaetram/common/util/utils';
import log from '@kaetram/common/util/log';
import { PacketType } from '@kaetram/common/network/modules';
import { Modules } from '@kaetram/common/network';
import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';

import type Grids from './map/grids';
import type Packet from '../network/packet';
import type Connection from '../network/connection';
import type SocketHandler from '../network/sockethandler';
import type Character from './entity/character/character';
import type Player from './entity/character/player/player';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';

export interface PacketData {
    packet: Packet;
    player?: Player;
    players?: Player[];
    ignore?: string;
    region?: number;
    list?: number[];
}

type ConnectionCallback = (connection: Connection) => void;

export default class World {
    public map: Map = new Map(this);
    public api: API = new API(this);
    public stores: Stores = new Stores(this);
    public warps: Warps = new Warps(this);
    public globals: Globals = new Globals(this);
    public entities: Entities = new Entities(this);
    public network: Network = new Network(this);
    public minigames: Minigames = new Minigames(this);
    public enchanter: Enchanter = new Enchanter(this);

    public discord: Discord = new Discord(config.hubEnabled);

    private maxPlayers = config.maxPlayers;

    public allowConnections = true;

    public connectionCallback?: ConnectionCallback;

    public constructor(public socketHandler: SocketHandler, public database: MongoDB) {
        this.discord.onMessage(this.globalMessage.bind(this));

        this.onConnection(this.network.handleConnection.bind(this.network));

        log.info('******************************************');

        this.tick();
    }

    /**
     * Starts the server packet parsing and region updating loop. Every `config.updateTime`
     * we send all the packets in the queue to the players and update the regions.
     */

    private tick(): void {
        if (config.hubEnabled) setInterval(() => this.api.pingHub(), config.hubPing);

        setInterval(() => {
            this.network.parse();
            this.map.regions.parse();
        }, config.updateTime);

        setInterval(() => this.save(), config.saveInterval);
    }

    /**
     * All packets are sent through this function. Here we organize who we send the packet to,
     * and perform further data checking (in the future if necessary).
     * @param packetType The method we are sending the packet.
     * @param data The data containing information about who the packet is sent to.
     */

    public push(packetType: number, data: PacketData): void {
        switch (packetType) {
            case PacketType.Broadcast: {
                return this.network.broadcast(data.packet);
            }

            case PacketType.Player: {
                return this.network.send(data.player!, data.packet);
            }

            case PacketType.Players: {
                return this.network.sendToPlayers(data.players!, data.packet);
            }

            case PacketType.Region: {
                return this.network.sendToRegion(data.region!, data.packet, data.ignore);
            }

            case PacketType.Regions: {
                return this.network.sendToSurroundingRegions(
                    data.region!,
                    data.packet,
                    data.ignore
                );
            }

            case PacketType.RegionList: {
                return this.network.sendToRegionList(data.list!, data.packet, data.ignore);
            }
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
                message: Utils.parseMessage(message),
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
            if (character.hasAttacker(cleanCharacter)) character.removeAttacker(cleanCharacter);

            if (!character.hasTarget()) return;

            if (character.target?.instance !== cleanCharacter.instance) return;

            character.clearTarget();

            if (character.hasAttacker(cleanCharacter)) character.removeAttacker(cleanCharacter);
        });
    }

    /**
     * Updates the status of `lPlayer` in the friends list of all players that
     * are currently logged in and have `lPlayer` in their friends list.
     * @param lPlayer The player that we are updating the status of relative to others.
     * @param logout Whether the `lPlayer` is logging out or not.
     */

    public linkFriends(lPlayer: Player, logout = false): void {
        // Parse the local friends first.
        this.syncFriendsList(lPlayer.username, logout);

        // If the hub is enabled, we request the hub to link friends across servers.
        if (config.hubEnabled) this.api.linkFriends(lPlayer, logout);
    }

    /**
     * Iterates through all the players currently logged in and updates the status
     * of `username` in their friends list if it exists.
     * @param username The username we are updating the status of.
     * @param logout The status we are updating the user to.
     */

    public syncFriendsList(username: string, logout = false, serverId = config.serverId): void {
        this.entities.forEachPlayer((player: Player) => {
            if (player.friends.hasFriend(username))
                player.friends.setStatus(username, !logout, serverId);
        });
    }

    /**
     * Iterates through all the players currently logged in and saves their data.
     */

    public save(): void {
        this.entities.forEachPlayer((player: Player) => player.save());

        log.debug(`${config.name} ${config.serverId} has successfully saved.`);
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
        return this.entities.getPlayer(username)!;
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
        return Object.keys(this.entities.players).length;
    }

    /**
     * Callback for when a connection is established.
     * @param callback Contains the connection instance.
     */

    public onConnection(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
    }
}
