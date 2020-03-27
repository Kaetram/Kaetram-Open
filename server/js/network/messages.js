/* global module */

let Packets = require('./packets'),
    Messages = {};

Messages.Handshake = class {

    constructor(info) {
        this.info = info;
    }

    serialize() {
        return [Packets.Handshake, this.info];
    }
};

Messages.Welcome = class {

    constructor(data) {
        this.info = data; //array of info
    }

    serialize() {
        return [Packets.Welcome, this.info];
    }
};

Messages.Spawn = class {

    constructor(entity) {
        this.entity = entity;
    }

    serialize() {
        return [Packets.Spawn, this.entity.getState()];
    }

};

Messages.List = class {

    constructor(list) {
        this.list = list;
    }

    serialize() {
        return [Packets.List, this.list];
    }
};

Messages.Sync = class {

    constructor(data) {
        this.info = data;
    }

    serialize() {
        return [Packets.Sync, this.info];
    }

};

Messages.Equipment = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Equipment, this.opcode, this.info];
    }

};

Messages.Movement = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Movement, this.opcode, this.info];
    }
};

Messages.Teleport = class {

    constructor(info) {
        this.info = info;
    }

    serialize() {
        return [Packets.Teleport, this.info];
    }

};

Messages.Despawn = class {

    constructor(id) {
        this.id = id;
    }

    serialize() {
        return [Packets.Despawn, this.id];
    }

};

Messages.Animation = class {

    constructor(id, data) {
        this.id = id;
        this.info = data;
    }

    serialize() {
        return [Packets.Animation, this.id, this.info];
    }

};

// TODO - Revise this when going over combat.
Messages.Combat = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Combat, this.opcode, this.info];
    }

};

Messages.Projectile = class {

    constructor(opcode, data) {
        this.opcode = opcode;
        this.info = data;
    }

    serialize() {
        return [Packets.Projectile, this.opcode, this.info];
    }

};

Messages.Population = class {

    constructor(playerCount) {
        this.playerCount = playerCount
    }

    serialize() {
        return [Packets.Population, this.playerCount];
    }

};

Messages.Points = class {

    constructor(data) {
        this.info = data;
    }

    serialize() {
        return [Packets.Points, this.info];
    }

};

Messages.Network = class {

    constructor(opcode) {
        this.opcode = opcode;
    }

    serialize() {
        return [Packets.Network, this.opcode];
    }
};

Messages.Chat = class {

    constructor(data) {
        this.info = data;
    }

    serialize() {
        return [Packets.Chat, this.info];
    }

};

Messages.Command = class {

    constructor(data) {
        this.info = data;
    }

    serialize() {
        return [Packets.Command, this.info];
    }

};

/**
 * Should we just have a packet that represents containers
 * as a whole or just send it separately for each?
 */

Messages.Inventory = class {

    constructor(opcode, data) {
        this.opcode = opcode;
        this.info = data;
    }

    serialize() {
        return [Packets.Inventory, this.opcode, this.info];
    }

};

Messages.Bank = class {

    constructor(opcode, data) {
        this.opcode = opcode;
        this.info = data;
    }

    serialize() {
        return [Packets.Bank, this.opcode, this.info];
    }

};

Messages.Ability = class {

    constructor(opcode, data) {
        this.opcode = opcode;
        this.info = data;
    }

    serialize() {
        return [Packets.Ability, this.opcode, this.info];
    }

};

Messages.Quest = class {

    constructor(opcode, data) {
        this.opcode = opcode;
        this.info = data;
    }

    serialize() {
        return [Packets.Quest, this.opcode, this.info];
    }

};

Messages.Notification = class {

    constructor(opcode, message, colour) {
        this.opcode = opcode;
        this.message = message;
        this.colour = colour;
    }

    serialize() {
        return [Packets.Notification, this.opcode, this.message, this.colour];
    }

};

Messages.Blink = class {

    constructor(instance) {
        this.instance = instance;
    }

    serialize () {
        return [Packets.Blink, this.instance];
    }

};

Messages.Heal = class {

    constructor(info) {
        this.info = info;
    }

    serialize() {
        return [Packets.Heal, this.info];
    }

};

Messages.Experience = class {

    constructor(info) {
        this.info = info;
    }

    serialize() {
        return [Packets.Experience, this.info];
    }

};

Messages.Death = class {

    constructor(id) {
        this.id = id;
    }

    serialize() {
        return [Packets.Death, this.id];
    }

};

Messages.Audio = class {

    constructor(song) {
        this.song = song;
    }

    serialize() {
        return [Packets.Audio, this.song];
    }

};

Messages.NPC = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.NPC, this.opcode, this.info];
    }

};

Messages.Respawn = class {

    constructor(instance, x, y) {
        this.instance = instance;
        this.x = x;
        this.y = y;
    }

    serialize() {
        return [Packets.Respawn, this.instance, this.x, this.y];
    }

};

Messages.Enchant = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Enchant, this.opcode, this.info];
    }

};

Messages.Guild = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Guild, this.opcode, this.info];
    }

};

Messages.Pointer = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Pointer, this.opcode, this.info];
    }

};

Messages.PVP = class {

    constructor(id, pvp) {
        this.id = id;
        this.pvp = pvp;
    }

    serialize() {
        return [Packets.PVP, this.id, this.pvp];
    }

};

Messages.Shop = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Shop, this.opcode, this.info];
    }

};

Messages.Minigame = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Minigame, this.opcode, this.info];
    }

};

Messages.Region = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Region, this.opcode, this.info];
    }
};

Messages.Overlay = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Overlay, this.opcode, this.info];
    }

};

Messages.Camera = class {

    constructor(opcode, info) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Camera, this.opcode, this.info];
    }

};

Messages.Bubble = class {

    constructor(info) {
        this.info = info;
    }

    serialize() {
        return [Packets.Bubble, this.info];
    }

};

module.exports = Messages;
