import _ from 'lodash';

import config from '@kaetram/common/config';

export interface Server {
    lastPing: number;
    serverId: string;
    host: string;
    port: number;
    accessToken: string;
    remoteServerHost: string;
}

type AddServerCallback = (id: string, server: Server) => void;
type RemoveServerCallback = (key: string, server: Server) => void;

/**
 * We keep track of the servers that are connected to the hub.
 * When a server goes online, it pings the hub (if hub config is enabled)
 * and it will ping the hub at a set interval. We keep track of those
 * pings here. If a server does not ping for a certain period of time,
 * we just remove it to preserve resources.
 */
export default class Servers {
    public servers: { [key: string]: Server } = {};

    private addServerCallback?: AddServerCallback;
    private removeServerCallback?: RemoveServerCallback;

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

            if (this.removeServerCallback) this.removeServerCallback(key, this.servers[key]);

            delete this.servers[key];
        });
    }

    /**
     * Adds a new server to our dictionary of servers. If the server already
     * exists, then we just update the last pinged time instead.
     * @param data Raw server data information obtained during server pinging.
     */

    public addServer(data: Server): void {
        if (data.serverId in this.servers) {
            this.servers[data.serverId].lastPing = Date.now();
            return;
        }

        this.servers[data.serverId] = {
            host: data.host,
            port: data.port,
            accessToken: data.accessToken,
            lastPing: Date.now(),
            remoteServerHost: data.remoteServerHost
        } as Server;

        if (this.addServerCallback)
            this.addServerCallback(data.serverId, this.servers[data.serverId]);
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

    public onAdd(callback: AddServerCallback): void {
        this.addServerCallback = callback;
    }

    /**
     * Callback for when we remove a server from our list.
     * @param callback The server key and object that we are removing.
     */

    public onRemove(callback: RemoveServerCallback): void {
        this.removeServerCallback = callback;
    }
}
