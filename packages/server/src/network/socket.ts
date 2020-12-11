/* global module */

import Connection from './connection';

class Socket {
    port: number;
    _connections: {};
    _counter: number;

    constructor(port: number) {
        this.port = port;

        this._connections = {};
        this._counter = 0;
    }

    addConnection(connection: Connection) {
        this._connections[connection.id] = connection;
    }

    removeConnection(id: string) {
        delete this._connections[id];
    }

    getConnection(id: string) {
        return this._connections[id];
    }
}

export default Socket;
