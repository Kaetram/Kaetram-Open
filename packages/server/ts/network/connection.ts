/* global module */

class Connection {

    constructor(id, connection, server) {
        this.id = id;
        this.socket = connection;
        this._server = server;

        this.socket.on('message', (message) => {
            if (this.listenCallback)
                this.listenCallback(JSON.parse(message));
        });

        this.socket.on('disconnect', () => {
            log.info('Closed socket: ' + this.socket.conn.remoteAddress);

            if (this.closeCallback)
                this.closeCallback();

            delete this._server.removeConnection(this.id);
        });
    }

    listen(callback) {
        this.listenCallback = callback;
    }

    onClose(callback) {
        this.closeCallback = callback;
    }

    send(message) {
        this.sendUTF8(JSON.stringify(message));
    }

    sendUTF8(data) {
        this.socket.send(data);
    }

    close(reason) {
        if (reason)
            log.info('[Connection] Closing - ' + reason);

        this.socket.conn.close();
    }

}

export default Connection;
