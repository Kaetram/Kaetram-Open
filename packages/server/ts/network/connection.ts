/* global module */

import WebSocket from './websocket';
import { SocketIO } from 'socket.io';
import log from '../util/log';

class Connection {

    public id: string;
    public socket: SocketIO;
    public _server: WebSocket;

    listenCallback: Function;
    closeCallback: Function;

    constructor(id: string, socket: SocketIO, server: WebSocket) {

        this.id = id;
        this.socket = socket;
        this._server = server;

        this.socket.on('message', (message: any) => {
            if (this.listenCallback)
                this.listenCallback(JSON.parse(message));
        });

        this.socket.on('disconnect', () => {
            log.info('Closed socket: ' + this.socket.conn.remoteAddress);

            if (this.closeCallback)
                this.closeCallback();

            this._server.removeConnection(this.id);
        });
    }

    listen(callback: Function) {
        this.listenCallback = callback;
    }

    onClose(callback: Function) {
        this.closeCallback = callback;
    }

    send(message: any) {
        this.sendUTF8(JSON.stringify(message));
    }

    sendUTF8(data: any) {
        this.socket.send(data);
    }

    close(reason: any) {
        if (reason)
            log.info('[Connection] Closing - ' + reason);

        this.socket.conn.close();
    }

}

export default Connection;
