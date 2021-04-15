import config from '../../config';

import SocketIO from './impl/socketio';
import WS from './impl/ws';

import Connection from './connection';

import Utils from '../util/utils';

export default class SocketHandler {

    private socketIO: SocketIO;
    private ws: WS;

    public ips: { [id: string]: number }
    public connections: { [id: string]: Connection };

    private readyCallback: () => void;
    private connectionCallback: (connection: Connection) => void;

    constructor() {

        this.ips = {};
        this.connections = {};

        this.socketIO = new SocketIO(this);
        this.ws = new WS(this);

        this.load();
    }

    load() {
        this.socketIO.onInitialize(() => { this.readyCallback(); });

        this.socketIO.onAdd((connection: Connection) => { this.add(connection); });
        this.ws.onAdd((connection: Connection) => { this.add(connection); });
    }

    /**
     * We add a connection to our dictionary of connections.
     * 
     * Key: The connection id.
     * Value: The connection itself.
     * 
     * @param connection The connection we are adding.
     */

    add(connection: Connection) {
        this.connections[connection.id] = connection;
    
        if (this.connectionCallback) this.connectionCallback(connection);
    }

    /**
     * Used to remove connections from our dictionary of connections.
     * 
     * @param id The connection id we are removing.
     */

    remove(id: string) {
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

    onReady(callback: () => void) {
        this.readyCallback = callback;
    }

    /**
     * The callback for when a new connection is received.
     * 
     * @param callback The callback containing the Connection that occurs.
     */

    onConnection(callback: (connection: Connection) => void) {
        this.connectionCallback = callback;
    }

}