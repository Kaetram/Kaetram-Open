import { ServerData } from '../controllers/servers';

import type { SerializedServer } from '@kaetram/common/types/api';

export default class Server {
    public lastPing = Date.now();

    private updateCallback?: () => void;

    public constructor(
        public name: string,
        public host: string,
        public port: number,
        public apiPort: number,
        public accessToken: string,
        public remoteServerHost: string,
        public players: string[],
        public maxPlayers: number
    ) {}

    /**
     * Updates the data with the information received
     * from the latest ping.
     * @param data The new data to update with.
     */

    public update(data: ServerData): void {
        this.lastPing = Date.now();
        this.players = data.players;

        this.updateCallback?.();
    }

    /**
     * Serializes the server data into a minimal object
     * to be used by the client to connect.
     * @returns A `SerializedServer` object.
     */

    public serialize(): SerializedServer {
        return {
            name: this.name,
            host: this.remoteServerHost,
            port: this.port,
            players: this.players.length,
            maxPlayers: this.maxPlayers
        };
    }

    /**
     * Callback for when the server has updated.
     */

    public onUpdate(callback: () => void): void {
        this.updateCallback = callback;
    }
}
