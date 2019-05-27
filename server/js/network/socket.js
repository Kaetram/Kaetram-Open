/* global module */

class Socket {
    constructor(port) {
        let self = this;

        self.port = port;

        self._connections = {};
        self._counter = 0;
    }

    addConnection(connection) {
        this._connections[connection.id] = connection;
    }

    removeConnection(id) {
        delete this._connections[id];
    }

    getConnection(id) {
        return this._connections[id];
    }

}

module.exports = Socket;