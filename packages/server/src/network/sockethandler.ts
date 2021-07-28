import SocketIO from './impl/socketio';
import WS from './impl/ws';

import type Connection from './connection';

export default class SocketHandler {
    private socketIO = new SocketIO(this);
    private ws = new WS(this);

    public ips: { [id: string]: number } = {};
    public connections: { [id: string]: Connection } = {};

    private readyCallback?(): void;
    private connectionCallback?: (connection: Connection) => void;

    constructor() {
        this.load();
    }

    load(): void {
        this.socketIO.onInitialize(() => {
            this.readyCallback?.();
        });

        this.socketIO.onAdd((connection: Connection) => {
            this.add(connection);
        });
        this.ws.onAdd((connection: Connection) => {
            this.add(connection);
        });
    }

    /**
     * We add a connection to our dictionary of connections.
     *
     * Key: The connection id.
     * Value: The connection itself.
     *
     * @param connection The connection we are adding.
     */

    add(connection: Connection): void {
        this.connections[connection.id] = connection;

        if (this.connectionCallback) this.connectionCallback(connection);
    }

    /**
     * Used to remove connections from our dictionary of connections.
     *
     * @param id The connection id we are removing.
     */

    remove(id: string): void {
        delete this.connections[id];
    }

    /**
     * Finds and returns a connection in our dictionary of connections.
     *
     * @param id The id of the connection we are trying to get.
     * @returns The connection element or null.
     */

    get(id: string): Connection {
        return this.connections[id];
    }

    /**
     * The callback that the main class uses to determine
     * if the websocket is ready.
     *
     * @param callback The void function callback
     */

    onReady(callback: () => void): void {
        this.readyCallback = callback;
    }

    /**
     * The callback for when a new connection is received.
     *
     * @param callback The callback containing the Connection that occurs.
     */

    onConnection(callback: (connection: Connection) => void): void {
        this.connectionCallback = callback;
    }
}
