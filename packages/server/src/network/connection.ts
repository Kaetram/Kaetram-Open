/* global module */

import { Socket } from 'socket.io';
import log from '../util/log';

class Connection {
    public id: string;
    public socket: Socket;

    private listenCallback: Function;
    private closeCallback: Function;

    constructor(id: string, socket: Socket) {
        this.id = id;
        this.socket = socket;
        
        this.socket.on('message', (message: any) => {
            try {
                if (this.listenCallback) this.listenCallback(JSON.parse(message));
            } catch (e) {
                log.error('Could not parse message: ' + message);
                console.log(e);
            }
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

    close(reason?: any) {
        if (reason) log.info('[Connection] Closing - ' + reason);

        this.socket.conn.close();
    }
}

export default Connection;
