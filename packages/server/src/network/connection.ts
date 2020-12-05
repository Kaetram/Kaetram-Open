/* global module */

import WebSocket from './websocket';
import { SocketIO } from 'socket.io';
import log from '../util/log';

class Connection {
    public id: string;
    public socket: SocketIO;

    private server: WebSocket;
    private rawWebSocket: boolean;

    listenCallback: Function;
    closeCallback: Function;

    constructor(id: string, socket: SocketIO, server: WebSocket, rawWebSocket?: boolean) {
        this.id = id;
        this.socket = socket;
        this.server = server;

        this.rawWebSocket = rawWebSocket;

        this.socket.on('message', (message: any) => {
            try {
                if (this.listenCallback) this.listenCallback(JSON.parse(message));
            } catch (e) {
                log.error('Could not parse message: ' + message);
                console.log(e);
            }
        });

        this.socket.on(this.rawWebSocket ? 'close' : 'disconnect', () => {
            log.info('Closed socket: ' + this.socket.conn.remoteAddress);

            if (this.closeCallback) this.closeCallback();

            this.server.removeConnection(this.id);
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
        if (reason) log.info('[Connection] Closing - ' + reason);

        if (this.rawWebSocket) this.socket.close();
        else this.socket.conn.close();
    }
}

export default Connection;
