/* global module */

class Connection {

    constructor(id, connection, server) {
        let self = this;

        self.id = id;
        self.socket = connection;
        self._server = server;

        self.socket.on('message', (message) => {
            if (self.listenCallback)
                self.listenCallback(JSON.parse(message));
        });

        self.socket.on('disconnect', () => {
            log.info('Closed socket: ' + self.socket.conn.remoteAddress);

            if (self.closeCallback)
                self.closeCallback();

            delete self._server.removeConnection(self.id);
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

module.exports = Connection;