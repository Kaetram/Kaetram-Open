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

    private cleanupInterval: NodeJS.Timeout | null = null;

    private addServerCallback?: AddServerCallback;
    private removeServerCallback?: RemoveServerCallback;

    public constructor() {
        this.load();
    }

    private load(): void {
        this.cleanupInterval = setInterval(() => {
            this.forEachServer((server, key) => {
                let time = Date.now();

                if (time - server.lastPing > config.cleanupThreshold) {
                    if (this.removeServerCallback)
                        this.removeServerCallback(key, this.servers[key]);

                    delete this.servers[key];
                }
            });
        }, config.cleanupTime);
    }

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

    public getServerCount(): number {
        return Object.keys(this.servers).length;
    }

    public forEachServer(callback: (server: Server, key: string) => void): void {
        _.each(this.servers, (server, key) => {
            callback(server, key);
        });
    }

    public onAdd(callback: AddServerCallback): void {
        this.addServerCallback = callback;
    }

    public onRemove(callback: RemoveServerCallback): void {
        this.removeServerCallback = callback;
    }
}
