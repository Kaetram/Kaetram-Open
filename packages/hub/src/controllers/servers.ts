import Server from '../model/server';

import log from '@kaetram/common/util/log';
import { Chat } from '@kaetram/common/network/impl';

import type Packet from '@kaetram/common/network/packet';
import type Connection from '../network/connection';
import type { SerializedServer } from '@kaetram/common/types/network';

type PlayerCallback = (
    username: string,
    serverId: number,
    logout: boolean,
    population: number
) => void;
type ServerCallback = (id: number, name: string) => void;
type MessageCallback = (
    source: string,
    message: string,
    serverName?: string,
    withArrow?: boolean
) => void;
export default class Servers {
    private servers: { [instance: string]: Server } = {};

    public playerCallback?: PlayerCallback;
    public messageCallback?: MessageCallback;

    private addCallback?: ServerCallback;
    private removeCallback?: ServerCallback;

    /**
     * Handles the creation of a new server object upon initial connection. This creates
     * the object and adds it to our list of servers after the handshake has completed.
     * @param instance The instance of the server we are connecting to.
     * @param connection The websocket connection to the server.
     */

    public connect(instance: string, connection: Connection): void {
        let server = new Server(instance, this, connection);

        // Callback for when the server finishes the handshake.
        server.onReady(() => this.add(server));
    }

    /**
     * Handles adding a server to our list of servers.
     * @param server The server object we are adding.
     */

    private add(server: Server): void {
        if (server.instance in this.servers)
            return log.error(`Server ${server.instance} already exists.`);

        this.servers[server.instance] = server;

        this.addCallback?.(server.id, server.name);
    }

    /**
     * Handles removing a server from our list of servers.
     * @param instance The instance of the server we are removing.
     */

    public remove(instance: string): void {
        // Prevent crashes from removing non-existent servers.
        if (!(instance in this.servers)) return;

        this.removeCallback?.(this.servers[instance].id, this.servers[instance].name);

        delete this.servers[instance];
    }

    /**
     * Broadcasts a message to all servers. Optionally we can exclude a server.
     * @param packet The packet object that we want to send to the server.
     * @param exclude The server we are excluding from the broadcast.
     */

    public broadcast(packet: Packet, exclude = ''): void {
        for (let server in this.servers) {
            if (server === exclude) continue;

            this.servers[server].send(packet);
        }
    }

    /**
     * Relays a global chat message to all the servers connected to the hub.
     * @param source Who is sending the message (generally someone on Discord).
     * @param message The string contents of the message.
     * @param colour Colour of the text we are sending.
     */

    public global(source: string, message: string, colour: string): void {
        this.broadcast(new Chat({ source, message, colour }));
    }

    /**
     * Handles a player logging in or out of the game. We use this
     * to update the Discord server with the amount of players online and
     * with the logout/login activity.
     * @param username The username of the player.
     * @param serverId The id of the server the player is on.
     * @param logout The type of action we are performing (defaults to false)
     */

    public handlePlayer(username: string, serverId: number, logout = false): void {
        let total = this.getTotalPlayers();

        this.playerCallback?.(username, serverId, logout, total);
    }

    /**
     * Checks that there is at least one server with space for a new player.
     * @returns Whether or not some of the servers have more player spaces than amount of players.
     */

    public hasSpace(): boolean {
        return Object.values(this.servers).some((server: Server) => {
            return server.players.length < server.maxPlayers;
        });
    }

    /**
     * Iterates through all the servers and finds the first one that has
     * space for the new player. If we cannot find a server then we
     * return undefined.
     * @returns The server that has space for a new player, or undefined if not found.
     */

    public findEmpty(): Server | undefined {
        for (let key in this.servers) {
            let server = this.servers[key];

            if (server.players.length >= server.maxPlayers - 1) continue;

            return server;
        }

        return undefined;
    }

    /**
     * Searches through all the servers and finds whether or not
     * the server contains the `username` specified.
     * @param username The username we are looking for.
     * @returns The server containing the user.
     */

    public findPlayer(username: string): Server | undefined {
        for (let key in this.servers)
            if (this.servers[key].players.includes(username)) return this.servers[key];

        return undefined;
    }

    /**
     * Looks through all the servers and adds the amount of players currently online.
     * @returns Number of total players spanning all servers.
     */

    public getTotalPlayers(): number {
        let total = 0;

        // Iterate through all the servers and add the amount of players.
        this.forEachServer((server: Server) => (total += server.players.length));

        return total;
    }

    /**
     * Iterates through all the servers and serializes them into an array.
     * @returns Contains an array of serialized server information.
     */

    public serialize(): SerializedServer[] {
        return Object.values(this.servers)
            .map((server: Server) => server.serialize())
            .sort((a, b) => {
                return a.id - b.id;
            });
    }

    /**
     * Iterates through all the server objects.
     * @param callback Contains the server object that we are iterating through currently.
     */

    public forEachServer(callback: (server: Server) => void): void {
        for (let server in this.servers) callback(this.servers[server]);
    }

    /**
     * Callback handler for when a new server is added.
     * @param callback Contains the name and id of the server added.
     */

    public onAdd(callback: ServerCallback): void {
        this.addCallback = callback;
    }

    /**
     * Callback handler for when a server is removed from our list.
     * @param callback Contains the name and id of the server removed.
     */

    public onRemove(callback: ServerCallback): void {
        this.removeCallback = callback;
    }

    /**
     * Callback for when a player logs in or out of the server. Used for updating
     * the Discord bot with the current population.
     * @param callback Contains the username of the player, whether they are
     * logging in or out, and the total population across all servers.
     */

    public onPlayer(callback: PlayerCallback): void {
        this.playerCallback = callback;
    }

    /**
     * Message for when anyone on any server sends a message. We send
     * these messages to the Discord bot.
     * @param callback Contains who sent the message and what was sent.
     */

    public onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }
}
