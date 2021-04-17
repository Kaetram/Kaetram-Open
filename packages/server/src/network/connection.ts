/* global module */

import { Socket } from 'socket.io';

import log from '../util/log';
import SocketHandler from './sockethandler';

class Connection {
    public id: string;
    
    private type: string;

    public socket: Socket;
    public socketHandler: SocketHandler;
    
    private listenCallback: Function;
    private closeCallback: Function;

    constructor(id: string, type: string, socket: Socket, socketHandler: SocketHandler) {
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

    close(reason?: string) {
        if (reason) log.info('[Connection] Closing - ' + reason);

        this.socket.disconnect(true);
    }

    getCloseSignal() {
        return this.type === 'WebSocket' ? 'close' : 'disconnect';
    }
}

export default Connection;
