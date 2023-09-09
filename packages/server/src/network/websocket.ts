import type Connection from './connection';
import type SocketHandler from './sockethandler';
import type { HttpRequest, HttpResponse } from 'uws';

export default abstract class WebSocket {
    public addCallback?: (connection: Connection) => void;
    public initializedCallback?: () => void;

    protected constructor(
        protected host: string,
        protected port: number,
        protected socketHandler: SocketHandler
    ) {}

    /**
     * Returns an empty response if someone uses HTTP protocol
     * to access the server.
     */

    public httpResponse(response: HttpResponse, _request: HttpRequest): void {
        response.end('This is server, why are you here?');
    }

    /**
     * Callback for when a connection is added.
     * @param callback Contains the connection that was just added.
     */

    public onAdd(callback: (connection: Connection) => void): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when the web socket has finished initializing.
     */

    public onInitialize(callback: () => void): void {
        this.initializedCallback = callback;
    }
}
