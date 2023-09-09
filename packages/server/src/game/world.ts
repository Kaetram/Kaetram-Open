import Globals from './globals/globals';
import Map from './map/map';
import Minigames from './minigames/minigames';

import Enchanter from '../controllers/enchanter';
import Entities from '../controllers/entities';
import Stores from '../controllers/stores';
import Warps from '../controllers/warps';
import Guilds from '../controllers/guilds';
import Crafting from '../controllers/crafting';
import API from '../network/api';
import Network from '../network/network';
import Client from '../network/client';
import Events from '../controllers/events';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Discord from '@kaetram/common/api/discord';
import { ChatPacket, GuildPacket } from '@kaetram/common/network/impl';
import { Modules, Opcodes } from '@kaetram/common/network';
import { PacketType } from '@kaetram/common/network/modules';

import type Grids from './map/grids';
import type Connection from '../network/connection';
import type Character from './entity/character/character';
import type SocketHandler from '../network/sockethandler';
import type Player from './entity/character/player/player';
import type Packet from '@kaetram/common/network/packet';
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
    public map: Map;
    public api: API;
    public stores: Stores;
    public warps: Warps;
    public globals: Globals;
    public entities: Entities;
    public network: Network;
    public minigames: Minigames;
    public enchanter: Enchanter = new Enchanter();
    public crafting: Crafting = new Crafting();
    public guilds: Guilds;
    public client: Client;
    public events: Events;

    public discord: Discord = new Discord(config.hubEnabled);

    private maxPlayers = config.maxPlayers;

    public allowConnections = true;

    public connectionCallback?: ConnectionCallback;

    public constructor(
        public socketHandler: SocketHandler,
        public database: MongoDB
    ) {
        this.map = new Map(this);
        this.api = new API(this);
        this.stores = new Stores(this);
        this.warps = new Warps(this);
        this.globals = new Globals(this);
        this.entities = new Entities(this);
        this.network = new Network(this);
        this.minigames = new Minigames(this);
        this.guilds = new Guilds(this);
        this.client = new Client(this);
        this.events = new Events(this);

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
            packet: new ChatPacket({
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
            if (character.hasAttacker(cleanCharacter)) character.removeAttacker(cleanCharacter);

            if (!character.hasTarget()) return;

            if (character.target?.instance !== cleanCharacter.instance) return;

            character.clearTarget();
        });
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
     * Finds a guild based on an identifier and synchronizes the online status of the
     * `username` member to the rest of the guild members. We use this method
     * since it is more efficient to only look through the guild members of the player
     * logging in/out rather than all the players in the world.
     * @param identifier The guild identifier that we are searching for.
     * @param username The username that we are updating the status of.
     * @param logout Whether or not we received a logout packet.
     * @param serverId The server id that the player is currently logged in to.
     */

    public async syncGuildMembers(
        identifier: string,
        username: string,
        logout = false,
        serverId = config.serverId
    ): Promise<void> {
        if (!identifier) return;

        let guild = await this.database.loader.loadGuild(identifier);

        if (!guild) return;

        // Iterate through the members in the guild.
        for (let member of guild.members) {
            // Skip if the member is the player we are updating.
            if (member.username === username) continue;

            let player = this.getPlayerByName(member.username);

            // Skip if player doesn't exist.
            if (!player) continue;

            // If the player is online, send a packet with a new status.
            player.send(
                new GuildPacket(Opcodes.Guild.Update, {
                    members: [
                        {
                            username,
                            serverId: logout ? -1 : serverId
                        }
                    ]
                })
            );
        }
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
     * Determines whether or not to use the double drop probability
     * based on the current special event status. These are statuses
     * enabled during the weekends randomly.
     * @returns The drop probability depending on the special event status.
     */

    public getDropProbability(): number {
        if (!this.events.isDoubleDrop()) return Modules.Constants.DROP_PROBABILITY;

        return this.events.doubleDropProbability;
    }

    /**
     * Uses the events controller to determine the experience per hit if the
     * event is currently enabled.
     * @returns The amount of experience per hit.
     */

    public getExperiencePerHit(): number {
        if (!this.events.isIncreasedExperience()) return Modules.Constants.EXPERIENCE_PER_HIT;

        return this.events.experiencePerHit;
    }

    /**
     * Callback for when a connection is established.
     * @param callback Contains the connection instance.
     */

    public onConnection(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
    }
}
