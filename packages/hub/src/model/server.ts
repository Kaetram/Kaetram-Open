import { ServerData } from '../controllers/servers';

export interface SerializedServer {
    host: string;
    port: number;
    maxPlayers: number;
}

export default class Server {
    public lastPing = Date.now();

    public constructor(
        public host: string,
        public port: number,
        public apiPort: number,
        public accessToken: string,
        public remoteServerHost: string,
        public maxPlayers: number,
        public players: string[]
    ) {}

    /**
     * Updates the data with the information received
     * from the latest ping.
     * @param data The new data to update with.
     */

    public update(data: ServerData): void {
        this.lastPing = Date.now();
        this.players = data.players;
    }

    /**
     * Serializes the server data into a minimal object
     * to be used by the client to connect.
     * @returns A `SerializedServer` object.
     */

    public serialize(): SerializedServer {
        return {
            host: this.host,
            port: this.port,
            maxPlayers: this.maxPlayers
        };
    }
}
