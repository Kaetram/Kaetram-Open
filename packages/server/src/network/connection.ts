import log from '@kaetram/common/util/log';

import type { Packets } from '@kaetram/common/network';
import type SocketHandler from './sockethandler';
import type { AnySocket, SocketType } from './websocket';

type ListenCallback = (message: [Packets, never]) => void;

export default class Connection {
    private listenCallback?: ListenCallback;
    private closeCallback?(): void;

    public constructor(
        public id: string,
        public type: SocketType,
        public socket: AnySocket,
        private socketHandler: SocketHandler
    ) {
        this.socket.on('message', (message) => {
            try {
                this.listenCallback?.(JSON.parse(message));
            } catch (error) {
                log.error(`Could not parse message: ${message}`);
                console.error(error);
            }
        });

        this.socket.on(this.getCloseSignal(), () => {
            log.info(`Closed socket: ${this.socket.conn.remoteAddress}.`);

            this.closeCallback?.();

            this.socketHandler.remove(this.id);
        });
    }

    public listen(callback: ListenCallback): void {
        this.listenCallback = callback;
    }

    public onClose(callback: () => void): void {
        this.closeCallback = callback;
    }

    public send(message: unknown): void {
        this.sendUTF8(JSON.stringify(message));
    }

    public sendUTF8(data: unknown): void {
        this.socket.send(data);
    }

    public close(reason?: string): void {
        if (reason) log.info(`[Connection] Closing - ${reason}`);

        this.type === 'WebSocket' ? this.socket.close() : this.socket.disconnect(true);
    }

    public getCloseSignal(): 'close' | 'disconnect' {
        return this.type === 'WebSocket' ? 'close' : 'disconnect';
    }
}
