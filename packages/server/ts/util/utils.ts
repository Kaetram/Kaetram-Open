/**
 * This package is used for creating functions used all throughout the
 * game server.
 */

import _ from 'underscore';
import Packets from '../network/packets';
import log from '../util/log';

export default {
    random(range: number) {
        return Math.floor(Math.random() * range);
    },

    randomRange(min: number, max: number) {
        return min + Math.random() * (max - min);
    },

    randomInt(min: number, max: number) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    getDistance(startX: number, startY: number, toX: number, toY: number) {
        let x = Math.abs(startX - toX),
            y = Math.abs(startY - toY);

        return x > y ? x : y;
    },

    positionOffset(radius: number) {
        return {
            x: this.randomInt(0, radius),
            y: this.randomInt(0, radius),
        };
    },

    /**
     * We are just using some incremental seeds to prevent ids/instances
     * from ending up with the same numbers/variables.
     */

    idSeed: 0,
    clientSeed: 0,
    instanceSeed: 0,
    socketSeed: 0,

    generateRandomId() {
        return ++this.idSeed + '' + this.randomInt(0, 25000);
    },

    generateClientId() {
        return ++this.clientSeed + '' + this.randomInt(0, 25000);
    },

    generateInstance() {
        return ++this.instanceSeed + '' + this.randomInt(0, 25000);
    },

    validPacket(packet: number) {
        let keys = Object.keys(Packets),
            filtered = [];

        for (let i = 0; i < keys.length; i++)
            if (!keys[i].endsWith('Opcode')) filtered.push(keys[i]);

        return packet > -1 && packet < Packets[filtered[filtered.length - 1]] + 1;
    },

    getCurrentEpoch() {
        return new Date().getTime();
    },

    formatUsername(username: string) {
        return username.replace(/\w\S*/g, (string) => {
            return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
        });
    },

    /**
     * This function is responsible for parsing a message and looking for special
     * characters (primarily used for colour codes). This function will be expanded
     * if necessary in the nearby future.
     */
    parseMessage(message: string) {
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
        } catch (e) {
            return '';
        }
    },
};
