/**
 * Useful utility functions that are used all throughout the server and client.
 */

import crypto from 'node:crypto';
import zlib from 'node:zlib';

import log from './log';

import config from '../config';
import { Modules, Packets } from '../network';

import bcryptjs from 'bcryptjs';
import ipaddr from 'ipaddr.js';

import type { Bonuses, Stats } from '../types/item';

export default {
    counter: -1, // A counter to prevent conflicts in ids.
    doubleLumberjacking: false, // Whether or not the double lumberjacking event is active.
    doubleMining: false, // Whether or not the double mining event is active.

    /**
     * Takes the type of entity and creates a UNIQUE instance id.
     * @param identifier The type of entity.
     * @returns A randomly generated string.
     */

    createInstance(identifier = 0): string {
        return `${identifier}-${this.randomInt(1000, 100_000)}${++this.counter}`;
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
     * Creates a distribution based on weight. Instead of having an equal chance
     * of picking out a number between min and max, we can have a higher chance
     * of either numbers depending on the weight. Lower weight means more likely
     * to pick numbers closer to maximum, and vice versa.
     * @param min Minimum number (inclusive)
     * @param max Maximum number (inclusive)
     * @param weight 0-infinity, closer to 0 higher chance of picking maximum.
     * @returns Random integer with weight between min and max.
     */

    randomWeightedInt(min: number, max: number, weight: number): number {
        return Math.floor(Math.pow(Math.random(), weight) * (max - min + 1) + min);
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

        for (let key of keys) if (!key.endsWith('Opcode')) filtered.push(key);

        return packet > -1 && packet < Packets[filtered.at(-1) as keyof typeof Packets] + 1;
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
     * This function is primarily used for comparing checksum data
     * of maps in order to determine if an update is necessary.
     * @param data Any form of data, string, numbers, etc.
     */

    getChecksum(data: string): string {
        return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
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
        return Math.abs(startX - toX) + Math.abs(startY - toY);
    },

    /**
     * Extracts the type of entity by taking the last number of the instance.
     */

    getEntityType(instance: string): number {
        return parseInt(instance.split('-')[0]);
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
     * Takes a string of data and uses bcrypt to hash it. We create
     * a callback function to return the hash as a string.
     * @param data The string that we want to hash.
     * @param callback Contains the resulting hash as a string.
     */

    hash(data: string, callback: (hash: string) => void): void {
        bcryptjs.hash(data, 10, (error: Error | null, hash: string) => {
            // Throw an error to prevent any further execution of the database.
            if (error) throw error;

            callback(hash);
        });
    },

    /**
     * Compares a plaintext string against a hash (generally stored in the database).
     * We use bcrypt for this and create a callback with the result.
     * @param data The plaintext string we want to compare.
     * @param hash The hash we want to compare against.
     * @param callback Contains the result of the comparison.
     */

    compare(data: string, hash: string, callback: (result: boolean) => void): void {
        bcryptjs.compare(data, hash, (error: Error | null, result: boolean) => {
            // Throw an error to prevent any further execution of the database.
            if (error) throw error;

            callback(result);
        });
    },

    /**
     * Compresses the data and returns a base64 of it in string format.
     * @param data Any string, generally a JSON string.
     * @param compression Compression format, can be gzip or zlib
     */

    compress(data: string, compression = 'gzip'): string {
        if (!data) return '';

        return compression === 'gzip'
            ? zlib.gzipSync(data).toString('base64')
            : zlib.deflateSync(data).toString('base64');
    },

    /**
     * Sanitizes a number and ensures it is non-fractional.
     * @param number The number we want to sanitize.
     * @param strict Ensures that the number is not negative.
     * @returns A sanitized number.
     */

    sanitizeNumber(number: number, strict = false): number {
        // If the number is not a number, we return 0.
        if (isNaN(number)) return 0;

        // A fractional number is not allowed, we revert it to positive and floor it.
        if (number % 1 !== 0 || strict) return Math.floor(Math.max(0, number));

        return Math.floor(number);
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
     * Checks if the username is valid. Valid usersnames are latin
     * characters only (lowercase and uppercase), numbers, spaces, underscores, and special symbols.
     * @param text The text we are trying to validate.
     */

    isValidUsername(text: string): boolean {
        return /^[\w ]+$/.test(text);
    },

    /**
     * Verifies that the password is within the proper parameters
     * of length and characters.
     * @param text The plaintext password we are trying to validate.
     */

    isValidPassword(text = ''): boolean {
        return text.length >= 3 && text.length <= 64;
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
     * Converts an IP address buffer (from UWS) into an IPv4 address.
     * @param buffer The address buffer.
     * @returns An IPv4 address in string format.
     */

    bufferToAddress(buffer: ArrayBuffer): string {
        try {
            return ipaddr.process(new TextDecoder().decode(buffer)).toString();
        } catch {
            return '69.69.69.69';
        }
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

    getSkill(key: string): Modules.Skills | undefined {
        if (!key) return;

        key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

        return Modules.Skills[key as keyof typeof Modules.Skills];
    },

    /**
     * For the purpose of not repeatedly writing the same stats.
     * @returns Empty stats values.
     */

    getEmptyStats(): Stats {
        return {
            crush: 0,
            slash: 0,
            stab: 0,
            archery: 0,
            magic: 0
        };
    },

    /**
     * Creates an empty bonuses object.
     * @returns Empty bonuses object with default values.
     */

    getEmptyBonuses(): Bonuses {
        return {
            accuracy: 0,
            strength: 0,
            archery: 0,
            magic: 0
        };
    }
};
