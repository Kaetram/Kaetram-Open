import type { SerializedServer } from '@kaetram/common/types/api';
import type { ServerData } from '../controllers/servers';

export default class Server {
    public lastPing = Date.now();

    private updateCallback?: () => void;

    public constructor(
        public id: number,
        public name: string,
        public host: string,
        public port: number,
        public apiPort: number,
        public accessToken: string,
        public remoteServerHost: string,
        public apiHost: string,
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
     * Adds a player to the server player list.
     * @param username The username we want to add.
     */

    public addPlayer(username: string): void {
        if (this.players.includes(username)) return;

        this.players.push(username);

        this.updateCallback?.();
    }

    /**
     * Removes a player from the server player list.
     * @param username The username we want to remove.
     */

    public removePlayer(username: string): void {
        this.players.splice(this.players.indexOf(username), 1);

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
            apiHost: this.apiHost,
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
