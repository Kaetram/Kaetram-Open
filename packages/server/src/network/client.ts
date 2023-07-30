import Incoming from '../controllers/incoming';

import WebSocket from 'websocket';
import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import { HandshakePacket, RelayPacket } from '@kaetram/common/network/impl';

import type World from '../game/world';
import type Packet from '@kaetram/common/network/packet';
import type { connection as Connection, Message } from 'websocket';

/**
 * The client class is responsible for connecting to the hub websocket server. This
 * essentially treats this server as a client to the hub. We can send messages to the
 * hub and receive messages from the hub. Previously we used RESTful POST/GET requests
 * to synchronize amongst servers, and as that was proven inefficient and torturous to
 * maintain, uWebSockets turned out to be far more efficient and less of a headache.
 * The client uses the `incoming` global controller to handle incoming messages from
 * the hub. Note that the player object has its own `incoming` controller and that
 * is different than the global one.
 */

export default class Client {
    private address = `ws://${config.hubWsHost}:${config.hubWsPort}`;

    private webSocket!: WebSocket.client;
    private connection!: Connection;
    private incoming!: Incoming;

    public constructor(private world: World) {
        if (!config.hubEnabled) return;

        // Initialize the connection to the hub.
        this.webSocket = new WebSocket.client();
        this.webSocket.connect(this.address);

        this.incoming = new Incoming(this.world);

        // Web socket events.
        this.webSocket.on('connect', this.handleOpen.bind(this));
        this.webSocket.on('connectFailed', this.handleError.bind(this));
    }

    /**
     * Used to notify us when a connection to the hub has been successfully
     * established. Once we open the connection we can begin the handshake.
     */

    private handleOpen(connection: Connection): void {
        log.debug(`Established a web socket connection to the hub!`);

        // Store the connection for later use.
        this.connection = connection;

        connection.on('message', this.handleMessage.bind(this));
        connection.on('close', this.handleClose.bind(this));

        // Relay the handshake packet to the connection immediately.
        connection.send(
            JSON.stringify(
                new HandshakePacket({
                    type: 'hub',
                    gVer: config.gver,
                    name: config.name,
                    serverId: config.serverId,
                    accessToken: config.accessToken,
                    remoteHost: config.remoteServerHost,
                    port: config.port,
                    players: this.world.entities.getPlayerUsernames(),
                    maxPlayers: config.maxPlayers
                }).serialize()
            )
        );
    }

    /**
     * Contains the packet information from the hub. We use these to determine
     * what actions the hub wants the server to perform.
     * @param message Contains the message event information.
     */

    private handleMessage(message: Message): void {
        if (message.type !== 'utf8') return;

        let info = message.utf8Data;

        // We received a raw UTF8 message from the hub, we don't really handle these.
        if (!info.startsWith('[')) return;

        let data = JSON.parse(info);

        // Handle incoming data from the hub.
        this.incoming.handle(data);
    }

    /**
     * Errors are generally occuring when we are unable to connect to the hub. We will
     * continuously attempt to reconnect to the hub until we are able to connect.
     */

    private handleError(): void {
        log.error(`Could not connect to hub WebSocket server, attempting again in 5 seconds...`);

        // Retry connection.
        setTimeout(() => this.webSocket.connect(this.address), 5000);
    }

    /**
     * If the hub goes under then we will attempt to reconnect to the hub. Occurs
     * when we restart the hub or if the hub crashes.
     */

    private handleClose(): void {
        log.error(`Lost connection to hub WebSocket server, attempting again in 5 seconds...`);

        // Retry connection.
        setTimeout(() => this.webSocket.connect(this.address), 5000);
    }

    /**
     * Serializes a packet and stringifies then sends it to websocket connection.
     * @param packet The packet (similar to how we handle packets normally)
     */

    public send(packet: Packet): void {
        if (!this.connection?.connected) return;

        this.connection.send(JSON.stringify(packet.serialize()));
    }

    /**
     * Relays a message to a player on another server (if they're online). Creates a relay packet,
     * which prepends the username to the array of packet information. The hub then just routes
     * this to the appropriate server.
     * @param username The username of the player to relay the message to.
     * @param packet The packet to relay to the player.
     */

    public relay(username: string, packet: Packet): void {
        this.send(new RelayPacket(username, packet));
    }
}
