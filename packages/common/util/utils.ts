/**
 * Useful utility functions that are used all throughout.
 */

import _ from 'lodash';
import crypto from 'crypto';
import zlib from 'zlib';

import { Packets } from '../network';
import log from './log';

export default {
    random(range: number): number {
        return Math.floor(Math.random() * range);
    },

    randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    },

    randomInt(min: number, max: number): number {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    getDistance(startX: number, startY: number, toX: number, toY: number): number {
        let x = Math.abs(startX - toX),
            y = Math.abs(startY - toY);

        return x > y ? x : y;
    },

    positionOffset(radius: number): Pos {
        return {
            x: this.randomInt(0, radius),
            y: this.randomInt(0, radius)
        };
    },

    connectionCounter: 0,

    getConnectionId(): string {
        return `1${this.random(1000)}${this.connectionCounter++}`;
    },

    /**
     * We are just using some incremental seeds to prevent ids/instances
     * from ending up with the same numbers/variables.
     */

    idSeed: 0,
    clientSeed: 0,
    instanceSeed: 0,
    socketSeed: 0,

    generateRandomId(): string {
        return `${++this.idSeed}${this.randomInt(0, 25_000)}`;
    },

    generateClientId(): string {
        return `${++this.clientSeed}${this.randomInt(0, 25_000)}`;
    },

    generateInstance(): string {
        return `${++this.instanceSeed}${this.randomInt(0, 25_000)}`;
    },

    validPacket(packet: number): boolean {
        let keys = Object.keys(Packets),
            filtered = [];

        for (let i = 0; i < keys.length; i++)
            if (!keys[i].endsWith('Opcode')) filtered.push(keys[i]);

        return (
            packet > -1 &&
            packet < Packets[filtered[filtered.length - 1] as keyof typeof Packets] + 1
        );
    },

    getCurrentEpoch(): number {
        return Date.now();
    },

    formatUsername(username: string): string {
        return username.replace(
            /\w\S*/g,
            (string) => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
        );
    },

    /**
     * This function is responsible for parsing a message and looking for special
     * characters (primarily used for colour codes). This function will be expanded
     * if necessary in the nearby future.
     */
    parseMessage(message: string): string {
        try {
            let messageBlocks = message.split('@');

            if (messageBlocks.length % 2 === 0) {
                log.warning('Improper message block format!');
                log.warning('Ensure format follows @COLOUR@ format.');
                return messageBlocks.join(' ');
            }

            _.each(messageBlocks, (_block, index) => {
                if (index % 2 !== 0)
                    // we hit a colour code.
                    messageBlocks[index] = `<span style="color:${messageBlocks[index]};">`;
            });

            let codeCount = messageBlocks.length / 2 - 1;

            for (let i = 0; i < codeCount; i++) messageBlocks.push('</span>');

            return messageBlocks.join('');
        } catch {
            return '';
        }
    },

    /**
     * This function is primarily used for comparing checksum data
     * of maps in order to determine if an update is necessary.
     * @param data Any form of data, string, numbers, etc.
     */
    getChecksum(data: string): string {
        return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    },

    /**
     * Helper function to avoid repetitive instances of comparison between
     * the unix epoch minus an event. Cleans up the code a bit.
     *
     * @param lastEvent The event we are subtracting from current time to obtain how much
     * time has passed.
     * @param threshold The threshold for how much time has passed in order to return true.
     */
    timePassed(lastEvent: number, threshold: number): boolean {
        return Date.now() - lastEvent < threshold;
    },

    /**
     * Compresses the data and returns a base64 of it in string format.
     * @param data Any string, generally a JSON string.
     * @param compression Compression format, can be gzip or zlib
     */
    compressData(data: string, compression = 'gzip'): string | undefined {
        if (!data) return;

        return compression === 'gzip'
            ? zlib.gzipSync(data).toString('base64')
            : zlib.deflateSync(data).toString('base64');
    },

    /**
     * We get the data size in bytes of `data`. This will be send to the
     * client as a buffer size variable to decompress the data.
     * @param data The data to calculate the size of, will be stringified.
     */
    getBufferSize(data: unknown): number {
        return encodeURI(JSON.stringify(data)).split(/%..|./).length - 1;
    }
};
