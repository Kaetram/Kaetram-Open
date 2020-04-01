/**
 * This package is used for creating functions used all throughout the
 * game server.
 */

import Packets from '../network/packets';

export default {
    random(range) {
        return Math.floor(Math.random() * range);
    },

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    randomInt(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    getDistance(startX, startY, toX, toY) {
        const x = Math.abs(startX - toX);
        const y = Math.abs(startY - toY);

        return x > y ? x : y;
    },

    positionOffset(radius) {
        return {
            x: this.randomInt(0, radius),
            y: this.randomInt(0, radius),
        };
    },

    /**
     * There is seriously no way two clients can end up with the same ID
     */
    generateClientId() {
        return (
            this.randomInt(0, 1000000) +
            this.randomInt(0, 40000) +
            this.randomInt(0, 9000)
        );
    },

    generateInstance(randomizer, id, modulo, posY?) {
        return `${randomizer}${this.randomInt(
            0,
            id
        )}${randomizer}${this.randomInt(0, modulo)}${posY || 0}`;
    },

    generateRandomId() {
        return `${1}${this.random(0, 200)}${this.random(0, 20)}${2}`;
    },

    validPacket(packet) {
        const keys = Object.keys(Packets);
        const filtered = [];

        for (let i = 0; i < keys.length; i++) {
            if (!keys[i].endsWith('Opcode')) filtered.push(keys[i]);
        }

        return (
            packet > -1 && packet < Packets[filtered[filtered.length - 1]] + 1
        );
    },

    getCurrentEpoch() {
        return new Date().getTime();
    },

    formatUsername(username) {
        return username.replace(/\w\S*/g, (string) => {
            return (
                string.charAt(0).toUpperCase() + string.substr(1).toLowerCase()
            );
        });
    },
};
