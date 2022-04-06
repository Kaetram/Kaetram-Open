import _ from 'lodash';

import Server, { SerializedServer } from '../model/server';

import config from '@kaetram/common/config';

type AddCallback = (id: number) => void;
type RemoveCallback = (key: string) => void;

// Raw server data received from the server itself.
export interface ServerData {
    lastPing: number;
    serverId: number;
    host: string;
    port: number;
    apiPort: number;
    accessToken: string;
    remoteServerHost: string;
    maxPlayers: number; // Max players in the world.
    players: string[]; // String array of usernames
}

/**
 * We keep track of the servers that are connected to the hub.
 * When a server goes online, it pings the hub (if hub config is enabled)
 * and it will ping the hub at a set interval. We keep track of those
 * pings here. If a server does not ping for a certain period of time,
 * we just remove it to preserve resources.
 */
export default class Servers {
    private servers: { [key: string]: Server } = {};

    private addCallback?: AddCallback;
    private removeCallback?: RemoveCallback;

    public constructor() {
        // Create the cleaning interval.
        setInterval(this.handleCleanUp.bind(this), config.cleanupTime);
    }

    /**
     * Handles cleaning and deletion of servers that have not
     * responded in a while.
     */

    private handleCleanUp(): void {
        this.forEachServer((server, key) => {
            if (!this.isServerTimedOut(server)) return;

            this.removeCallback?.(key);

            delete this.servers[key];
        });
    }

    /**
     * Adds a new server to our dictionary of servers. If the server already
     * exists, then we just update the last pinged time instead.
     * @param data Raw server data information obtained during server pinging.
     */

    public add(data: ServerData): void {
        if (data.serverId in this.servers) return this.servers[data.serverId].update(data);

        this.servers[data.serverId] = new Server(
            data.host,
            data.port,
            data.apiPort,
            data.accessToken,
            data.remoteServerHost,
            data.maxPlayers,
            data.players
        );

        this.addCallback?.(data.serverId);
    }

    /**
     * Grabs a server from our list based on its id.
     * @param id The id of the server we are trying to grab.
     * @returns A server object.
     */

    public get(id: string): Server {
        return this.servers[id];
    }

    /**
     * Serialize all servers and store them in an array of Server
     * objects. This is used for the hub to send to the client.
     */

    public getAll(): SerializedServer[] {
        return _.map(this.servers, (server: Server) => {
            return server.serialize();
        });
    }

    /**
     * Checks the servers to see whether or not we
     * have at least one server with space in it.
     * @returns Boolean if we have at least one server with space.
     */

    public hasEmpty(): boolean {
        return !!_.some(this.servers, (server: Server) => {
            return server.players.length < server.maxPlayers - 1;
        });
    }

    /**
     * Looks through all the servers and finds one
     * that has enough space.
     * @param callback Server with enough space for players.
     */

    public findEmpty(callback: (server: Server) => void): void {
        this.forEachServer((server) => {
            // -1 for a threshold of empty space.
            if (server.players.length >= server.maxPlayers - 1) return;

            callback(server);
        });
    }

    /**
     * Searches through all the servers and finds whether or not
     * the server contains the `username` specified.
     * @param username The username we are looking for.
     * @returns The server containing the user.
     */

    public findPlayer(username: string): Server | undefined {
        return _.find(this.servers, (server: Server) => {
            return _.includes(server.players, username);
        });
    }

    /**
     * Checks if the last time we pinged a server is greater than the
     * threshold for cleaning up and removing the server.
     * @param server The server we are checking.
     * @returns True if the difference between the last ping and the current time is greater than the threshold.
     */

    private isServerTimedOut(server: Server): boolean {
        return Date.now() - server.lastPing > config.cleanupThreshold;
    }

    /**
     * Total amount of servers that are in our list.
     * @returns Length of the keys of the dictionary of servers.
     */

    public getServerCount(): number {
        return Object.keys(this.servers).length;
    }

    /**
     * Iterates through each server in our list and creates a callback.
     * @param callback Callback containing the server object and server key.
     */

    public forEachServer(callback: (server: Server, key: string) => void): void {
        _.each(this.servers, callback);
    }

    /**
     * Callback for when we are adding a new server to our list.
     * @param callback The server id and the server object we are adding.
     */

    public onAdd(callback: AddCallback): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when we remove a server from our list.
     * @param callback The server key and object that we are removing.
     */

    public onRemove(callback: RemoveCallback): void {
        this.removeCallback = callback;
    }
}
