class Socket {
    public _connections: any;

    port: any;

    _counter: number;

    constructor(port) {
        this.port = port;

        this._connections = {};
        this._counter = 0;
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

export default Socket;
