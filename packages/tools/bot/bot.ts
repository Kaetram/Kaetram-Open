#!/usr/bin/env -S yarn tsx

import Entity from './entity';

import WebSocket from 'websocket';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Map from '@kaetram/server/data/map/world.json';

import type { connection as Connection } from 'websocket';

const BOT_COUNT = 960;

export default class Bot {
    private entities: { [instance: string]: Entity } = {};
    private collisions = Array.from({ length: Map.width * Map.height });

    public constructor() {
        log.info(`Starting ${config.name} bot with ${BOT_COUNT} bots...`);

        this.loadCollisions();

        log.info(`Loaded ${this.collisions.length} collisions.`);

        // Begin the connection process.
        setInterval(() => {
            if (Object.keys(this.entities).length < BOT_COUNT) this.connect();
        }, 1500);
    }

    /**
     * Iterates through the map and determines whether or not the tile
     * at every index is a collision. We use this so that the bots don't
     * walk into walls.
     */

    private loadCollisions(): void {
        log.info(`Loading collisions for ${Map.width}x${Map.height} map...`);

        // Initialize empty array
        this.collisions.fill(1);

        for (let index in Map.data) {
            let tile = Map.data[index];

            if (!Array.isArray(tile)) {
                if (!Map.collisions.includes(tile)) this.collisions[index] = 0;
                continue;
            }

            for (let id of tile) if (Map.collisions.includes(id)) continue;
        }
    }

    /**
     * Creates a WebSocket connection to the server and handles the
     * handshake process. Once the handshake is complete, the bot will
     * begin roaming around and sending chat messages.
     */

    private connect(): void {
        let webSocket = new WebSocket.client();

        // Connect to the default configurations for the server.
        webSocket.connect(`ws://${config.host}:${config.port}`);

        webSocket.on('connect', (connection: Connection) => {
            let entity = new Entity(this, connection);

            // Store the entity once the handshake is complete.
            entity.onReady(() => (this.entities[entity.instance] = entity));

            // When the connection is closed, we remove the entity from the list.
            connection.on('close', () => {
                log.info(`Bot #${entity.instance} disconnected.`);

                delete this.entities[entity.instance];
            });
        });

        // If the connection fails, we log the error.
        webSocket.on('connectFailed', () => {
            log.error(`Failed to create bot #${Object.keys(this.entities).length}`);
        });
    }

    /**
     * Checks if the specified tile is a collision. Convers the x and y
     * coordinates into an index and checks the collisions array.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns Whether or not the tile is a collision.
     */

    public isCollision(x: number, y: number): boolean {
        let index = x + y * Map.width;

        return this.collisions[index] === 1;
    }
}

new Bot();
