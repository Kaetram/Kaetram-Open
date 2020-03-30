"use strict";
/**
 * This package is used for creating functions used all throughout the
 * game server.
 */
exports.__esModule = true;
var packets_1 = require("../network/packets");
exports["default"] = {
    random: function (range) {
        return Math.floor(Math.random() * range);
    },
    randomRange: function (min, max) {
        return min + Math.random() * (max - min);
    },
    randomInt: function (min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },
    getDistance: function (startX, startY, toX, toY) {
        var x = Math.abs(startX - toX);
        var y = Math.abs(startY - toY);
        return x > y ? x : y;
    },
    positionOffset: function (radius) {
        return {
            x: this.randomInt(0, radius),
            y: this.randomInt(0, radius)
        };
    },
    /**
     * There is seriously no way two clients can end up with the same ID
     */
    generateClientId: function () {
        return (this.randomInt(0, 1000000) +
            this.randomInt(0, 40000) +
            this.randomInt(0, 9000));
    },
    generateInstance: function (randomizer, id, modulo, posY) {
        return "" + randomizer + this.randomInt(0, id) + randomizer + this.randomInt(0, modulo) + (posY || 0);
    },
    generateRandomId: function () {
        return "" + 1 + this.random(0, 200) + this.random(0, 20) + 2;
    },
    validPacket: function (packet) {
        var keys = Object.keys(packets_1["default"]);
        var filtered = [];
        for (var i = 0; i < keys.length; i++)
            if (!keys[i].endsWith('Opcode'))
                filtered.push(keys[i]);
        return (packet > -1 && packet < packets_1["default"][filtered[filtered.length - 1]] + 1);
    },
    getCurrentEpoch: function () {
        return new Date().getTime();
    },
    formatUsername: function (username) {
        return username.replace(/\w\S*/g, function (string) {
            return (string.charAt(0).toUpperCase() + string.substr(1).toLowerCase());
        });
    }
};
