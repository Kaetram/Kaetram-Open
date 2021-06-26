/* eslint-disable max-classes-per-file */

import Packets from './packets';

import Utils from '../util/utils';

const Messages: any = {};

Messages.Handshake = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Handshake, this.info];
    }
};

Messages.Welcome = class {
    info: any;

    constructor(info: any) {
        this.info = info; //array of info
    }

    serialize() {
        return [Packets.Welcome, this.info];
    }
};

Messages.Spawn = class {
    entity: any;

    constructor(entity: any) {
        this.entity = entity;
    }

    serialize() {
        return [Packets.Spawn, this.entity.getState()];
    }
};

Messages.List = class {
    list: any;

    constructor(list: any) {
        this.list = list;
    }

    serialize() {
        return [Packets.List, this.list];
    }
};

Messages.Sync = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Sync, this.info];
    }
};

Messages.Equipment = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Equipment, this.opcode, this.info];
    }
};

Messages.Movement = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Movement, this.opcode, this.info];
    }
};

Messages.Teleport = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Teleport, this.info];
    }
};

Messages.Despawn = class {
    id: any;

    constructor(id: any) {
        this.id = id;
    }

    serialize() {
        return [Packets.Despawn, this.id];
    }
};

Messages.Animation = class {
    id: any;
    info: any;

    constructor(id: any, info: any) {
        this.id = id;
        this.info = info;
    }

    serialize() {
        return [Packets.Animation, this.id, this.info];
    }
};

// TODO - Revise this when going over combat.
Messages.Combat = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Combat, this.opcode, this.info];
    }
};

Messages.Projectile = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Projectile, this.opcode, this.info];
    }
};

Messages.Population = class {
    playerCount: number;

    constructor(playerCount: number) {
        this.playerCount = playerCount;
    }

    serialize() {
        return [Packets.Population, this.playerCount];
    }
};

Messages.Points = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Points, this.info];
    }
};

Messages.Network = class {
    opcode: number;

    constructor(opcode: number) {
        this.opcode = opcode;
    }

    serialize() {
        return [Packets.Network, this.opcode];
    }
};

Messages.Chat = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Chat, this.info];
    }
};

Messages.Command = class {
    info: any;

    constructor(info: any) {
        this.info = info;
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
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Inventory, this.opcode, this.info];
    }
};

Messages.Bank = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Bank, this.opcode, this.info];
    }
};

Messages.Ability = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Ability, this.opcode, this.info];
    }
};

Messages.Quest = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Quest, this.opcode, this.info];
    }
};

Messages.Notification = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Notification, this.opcode, this.info];
    }
};

Messages.Blink = class {
    instance: string;

    constructor(instance: string) {
        this.instance = instance;
    }

    serialize() {
        return [Packets.Blink, this.instance];
    }
};

Messages.Heal = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Heal, this.info];
    }
};

Messages.Experience = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Experience, this.opcode, this.info];
    }
};

Messages.Death = class {
    id: string;

    constructor(id: any) {
        this.id = id;
    }

    serialize() {
        return [Packets.Death, this.id];
    }
};

Messages.Audio = class {
    song: string;

    constructor(song: string) {
        this.song = song;
    }

    serialize() {
        return [Packets.Audio, this.song];
    }
};

Messages.NPC = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.NPC, this.opcode, this.info];
    }
};

Messages.Respawn = class {
    instance: string;
    x: number;
    y: number;

    constructor(instance: string, x: number, y: number) {
        this.instance = instance;
        this.x = x;
        this.y = y;
    }

    serialize() {
        return [Packets.Respawn, this.instance, this.x, this.y];
    }
};

Messages.Enchant = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Enchant, this.opcode, this.info];
    }
};

Messages.Guild = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Guild, this.opcode, this.info];
    }
};

Messages.Pointer = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Pointer, this.opcode, this.info];
    }
};

Messages.PVP = class {
    id: string;
    pvp: boolean;

    constructor(id: string, pvp: boolean) {
        this.id = id;
        this.pvp = pvp;
    }

    serialize() {
        return [Packets.PVP, this.id, this.pvp];
    }
};

Messages.Shop = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Shop, this.opcode, this.info];
    }
};

Messages.Minigame = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Minigame, this.opcode, this.info];
    }
};

Messages.Region = class {
    opcode: number;
    bufferSize: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.bufferSize = Utils.getBufferSize(info);
        this.info = Utils.compressData(JSON.stringify(info));
    }

    serialize() {
        return [Packets.Region, this.opcode, this.bufferSize, this.info];
    }
};

Messages.Overlay = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Overlay, this.opcode, this.info];
    }
};

Messages.Camera = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Camera, this.opcode, this.info];
    }
};

Messages.Bubble = class {
    info: any;

    constructor(info: any) {
        this.info = info;
    }

    serialize() {
        return [Packets.Bubble, this.info];
    }
};

Messages.Profession = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.Profession, this.opcode, this.info];
    }
};

Messages.BuildUp = class {
    opcode: number;
    info: any;

    constructor(opcode: number, info: any) {
        this.opcode = opcode;
        this.info = info;
    }

    serialize() {
        return [Packets.BuildUp, this.opcode, this.info];
    }
};

export default Messages;
