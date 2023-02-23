import SocketIO from './sockets/socketio';

import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type Connection from './connection';

interface Addresses {
    [address: string]: {
        count: number;
        lastTime: number;
    };
}

export default class SocketHandler {
    private socketIO: SocketIO;

    public addresses: Addresses = {}; // Keeps track of addresses, their counts, and their last connection time.
    public connections: { [instance: string]: Connection } = {}; // List of all connections to the server.

    private connectionCallback?: (connection: Connection) => void;

    public constructor() {
        this.socketIO = new SocketIO(this);

        this.socketIO.onAdd(this.add.bind(this));
    }

    /**
     * We add a connection to our dictionary of connections.
     *
     * Key: The connection instance identifier.
     * Value: The connection itself.
     *
     * @param connection The connection we are adding.
     */

    private add(connection: Connection): void {
        this.connections[connection.instance] = connection;

        this.addAddress(connection.address);

        this.connectionCallback?.(connection);
    }

    /**
     * Stores an address into our dictioanry of addresses. We keep track of how many connected
     * addresses for an IP address there are, as well as the last connection time.
     * @param address String of the remote address we are adding.
     */

    private addAddress(address: string): void {
        // Create the first entry if it does not exist.
        if (!(address in this.addresses)) this.addresses[address] = { count: 0, lastTime: 0 };

        this.addresses[address].count++;
    }

    /**
     * Used to remove connections from our dictionary of connections.
     * @param instance The identifier (relates to player's object instance) of the
     * connection that we are removing from our dictionaries.
     */

    public remove(instance: string): void {
        // In the event the connection disconnects before it is added to the dictionaries.
        if (!(instance in this.connections)) return;

        this.removeAddress(this.connections[instance].address);

        delete this.connections[instance];
    }

    /**
     * Removes an address from our dictionary. If there are no more connections using the same
     * address then we can delete the entry.
     * @param address The address we are removing.
     */

    private removeAddress(address: string): void {
        this.addresses[address].count--;

        // Delete if there are no more connections of this address.
        if (this.addresses[address].count === 0) delete this.addresses[address];
    }

    /**
     * Finds and returns a connection in our dictionary of connections.
     *
     * @param instance The instance of the connection we are trying to get.
     * @returns The connection element or null.
     */

    public get(instance: string): Connection {
        return this.connections[instance];
    }

    /**
     * Checks whether the current IP address has reached the maximum allowed connections.
     * @param address The IP address we are checking.
     * @returns Whether the IP address has maximum connection counts.
     */

    public isMaxConnections(address: string): boolean {
        return this.addresses[address].count > Modules.Constants.MAX_CONNECTIONS;
    }

    /**
     * Updates the last time a connection was made from an address.
     * @param address The IP address we are updating.
     */

    public updateLastTime(address: string): void {
        this.addresses[address].lastTime = Date.now();
    }

    /**
     * The callback for when a new connection is received.
     *
     * @param callback The callback containing the Connection that occurs.
     */

    public onConnection(callback: (connection: Connection) => void): void {
        this.connectionCallback = callback;
    }
}
