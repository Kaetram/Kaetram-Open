/* global module */

import { Socket } from 'socket.io';
import ws from 'ws';

import log from '../util/log';
import WS from './impl/ws';
import SocketHandler from './sockethandler';

class Connection {
    public id: string;

    public type: string;

    public socket: Socket | ws.Socket;
    public socketHandler: SocketHandler;

    private listenCallback: (message: JSON) => void;
    private closeCallback: () => void;

    constructor(id: string,
        type: string,
        socket: Socket | ws.Socket,
        socketHandler: SocketHandler
    ) {
        this.id = id;
        this.type = type;
        this.socket = socket;
        this.socketHandler = socketHandler;

        this.socket.on('message', (message: any) => {
            try {
                if (this.listenCallback) this.listenCallback(JSON.parse(message));
            } catch (e) {
                log.error('Could not parse message: ' + message);
                console.log(e);
            }
        });

        this.socket.on(this.getCloseSignal(), () => {
            log.info(`Closed socket: ${this.socket.conn.remoteAddress}.`);

            if (this.closeCallback) this.closeCallback();

            this.socketHandler.remove(this.id);
        });
    }

    listen(callback: (message: JSON) => void): void {
        this.listenCallback = callback;
    }

    onClose(callback: () => void): void {
        this.closeCallback = callback;
    }

    send(message: string): void {
        this.sendUTF8(JSON.stringify(message));
    }

    sendUTF8(data: any): void {
        this.socket.send(data);
    }

    close(reason?: string): void {
        if (reason) log.info('[Connection] Closing - ' + reason);

        this.type === 'WebSocket' ? this.socket.close() : this.socket.disconnect(true);
    }

    getCloseSignal(): string {
        return this.type === 'WebSocket' ? 'close' : 'disconnect';
    }
}

export default Connection;
