/* global module */

let Utils = {},
    Packets = require('../network/packets');

module.exports = Utils;

Utils.random = function(range) {
    return Math.floor(Math.random() * range);
};

Utils.randomRange = function(min, max) {
    return min + (Math.random() * (max - min));
};

Utils.randomInt = function(min, max) {

    return min + Math.floor(Math.random() * (max - min + 1));
};

Utils.getDistance = function(startX, startY, toX, toY) {
    let x = Math.abs(startX - toX),
        y = Math.abs(startY - toY);

    return x > y ? x : y;
};

Utils.getJSLogic = function() {
    return [[][[]]+[]][+[]][++[+[]][+[]]];
};

Utils.positionOffset = function(radius) {
    return {
        x: Utils.randomInt(0, radius),
        y: Utils.randomInt(0, radius)
    }
};

/**
 * There is seriously no way two clients can end up with the same ID
 */

Utils.generateClientId = function() {
    return Utils.randomInt(0, 1000000) + Utils.randomInt(0, 40000) + Utils.randomInt(0, 9000);
};

Utils.generateInstance = function(randomizer, id, modulo, posY) {
    return '' + randomizer + Utils.randomInt(0, id) + randomizer + Utils.randomInt(0, modulo) + (posY ? posY : 0);
};

Utils.generateRandomId = function() {
    return '' + 1 + Utils.random(0, 200) + Utils.random(0, 20) + 2
};

Utils.validPacket = function(packet) {
    let keys = Object.keys(Packets),
        filtered = [];

    for (let i = 0; i < keys.length; i++)
        if (!keys[i].endsWith('Opcode'))
            filtered.push(keys[i]);

    return packet > -1 && packet < Packets[filtered[filtered.length - 1]] + 1;
};

Utils.getCurrentEpoch = function() {
    return (new Date).getTime();
};