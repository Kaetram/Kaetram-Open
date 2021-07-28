import log from '../util/log';

import type { Socket } from 'socket.io';
import type SocketHandler from './sockethandler';

type ListenCallback = (message: [number, never]) => void;

export default class Connection {
    private listenCallback?: ListenCallback;
    private closeCallback?(): void;

    constructor(
        public id: string,
        public type: string,
        public socket: Socket,
        private socketHandler: SocketHandler
    ) {
        this.socket.on('message', (message) => {
            try {
                if (this.listenCallback) this.listenCallback(JSON.parse(message));
            } catch (error) {
                log.error(`Could not parse message: ${message}`);
                console.error(error);
            }
        });

        this.socket.on(this.getCloseSignal(), () => {
            log.info(`Closed socket: ${this.socket.conn.remoteAddress}.`);

            if (this.closeCallback) this.closeCallback();

            this.socketHandler.remove(this.id);
        });
    }

    listen(callback: ListenCallback): void {
        this.listenCallback = callback;
    }

    onClose(callback: () => void): void {
        this.closeCallback = callback;
    }

    send(message: unknown): void {
        this.sendUTF8(JSON.stringify(message));
    }

    sendUTF8(data: unknown): void {
        this.socket.send(data);
    }

    close(reason?: string): void {
        if (reason) log.info(`[Connection] Closing - ${reason}`);

        this.socket.disconnect(true);
    }

    getCloseSignal(): 'close' | 'disconnect' {
        return this.type === 'WebSocket' ? 'close' : 'disconnect';
    }
}
