/**
 * Useful utility functions that are used all throughout the server and client.
 */

import _ from 'lodash-es';
import crypto from 'crypto';
import zlib from 'zlib';

import log from './log';
import config from '../config';

import { Modules, Packets } from '../network';

export default {
    counter: -1, // A counter to prevent conflicts in ids.

    /**
     * Takes the type of entity and creates a UNIQUE instance id.
     * @param identifier The type of entity.
     * @returns A randomly generated string.
     */

    createInstance(identifier = 0): string {
        return identifier.toString() + this.randomInt(1000, 100_000) + ++this.counter;
    },

    /**
     * Extracts the type of entity by taking the last number of the instance.
     */

    getEntityType(instance: string): number {
        return parseInt(instance.slice(0, 1));
    },

    /**
     * Pseudo-random float number generator using Math library.
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @param decimalPoint How many decimal points.
     * @returns Random value
     */

    randomFloat(min: number, max: number, decimalPoint = 4): number {
        return parseFloat((min + Math.random() * (max - min + 1)).toFixed(decimalPoint));
    },

    /**
     * Generates a random integer number using Math library.
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @returns Random integer between min and max.
     */

    randomInt(min: number, max: number): number {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    /**
     * Gets a distance between two points in the grid space.
     * @param startX Starting point x grid space coordinate.
     * @param startY Starting point y grid space coordinate.
     * @param toX Ending point x grid space coordinate.
     * @param toY Ending point y grid space coordinate.
     * @returns An integer of the amount of tiles between the two points.
     */

    getDistance(startX: number, startY: number, toX: number, toY: number): number {
        let x = Math.abs(startX - toX),
            y = Math.abs(startY - toY);

        return x > y ? x : y;
    },

    /**
     * Creates a random offset based on the radius.
     * @param radius How far the offset should be.
     * @returns Position object containing the offset.
     */

    positionOffset(radius: number): Position {
        return {
            x: this.randomInt(0, radius),
            y: this.randomInt(0, radius)
        };
    },

    /**
     * Checks whether or not a packet exists in the enum.
     */

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

    /**
     * Takes any name (or string as a matter of fact) and capitalizes
     * every first letter after a space.
     * Example: 'tHiS Is a usErName' -> 'This Is A Username'
     * @param name The raw username string defaulting to '' if not specified.
     * @returns The formatted name string.
     */

    formatName(name = ''): string {
        return name.replace(
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

            _.each(messageBlocks, (_block: string, index: number) => {
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

    compress(data: string, compression = 'gzip'): string | undefined {
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
    },

    /**
     * Takes a string position (from Constants) and converts it to
     * a type Position object.
     * @param position String position format of `231,41`.
     * @returns Position object with x and y coordinates.
     */

    getPositionFromString(position: string): Position {
        let splitPosition = position.split(',');

        return {
            x: parseInt(splitPosition[0]),
            y: parseInt(splitPosition[1])
        };
    },

    /**
     * Verifies the email string against RegEx.
     * @param email Email string to verify.
     */

    isEmail(email: string): boolean {
        return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(
            email
        );
    },

    /**
     * Grabs the URL of a server depending on whether
     * or not SSL is currently enabled.
     * @param host The hostname of the server.
     * @param port The port of the server.
     * @param path The server API we want to send a request to.
     * @param ssl Whether or not SSL is enabled.
     * @returns A string containing the server's URL.
     */

    getUrl(host: string, port: number, path: string, ssl = false): string {
        return config.ssl && !ssl ? `https://${host}/${path}` : `http://${host}:${port}/${path}`;
    },

    /**
     * Converts a string key into a Modules element that can be
     * used in rewarding skills.
     * @param key Raw key from the achievement JSON.
     */

    getSkill(key: string): Modules.Skills {
        if (!key) return -1;

        key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

        let skill = Modules.Skills[key as keyof typeof Modules.Skills];

        return skill !== undefined ? skill : -1;
    }
};
