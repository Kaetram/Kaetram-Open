import Packets from './packets';

export default {
    Handshake: class {
        info: any;

        constructor(info) {
            this.info = info;
        }

        serialize() {
            return [Packets.Handshake, this.info];
        }
    },

    Welcome: class {
        info: any;

        constructor(data) {
            this.info = data; // array of info
        }

        serialize() {
            return [Packets.Welcome, this.info];
        }
    },

    Spawn: class {
        entity: any;

        constructor(entity) {
            this.entity = entity;
        }

        serialize() {
            return [Packets.Spawn, this.entity.getState()];
        }
    },

    List: class {
        list: any;

        constructor(list) {
            this.list = list;
        }

        serialize() {
            return [Packets.List, this.list];
        }
    },

    Sync: class {
        info: any;

        constructor(data) {
            this.info = data;
        }

        serialize() {
            return [Packets.Sync, this.info];
        }
    },

    Equipment: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Equipment, this.opcode, this.info];
        }
    },

    Movement: class {
        opcode: any;

        info: any;

        constructor(opcode, info?) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Movement, this.opcode, this.info];
        }
    },

    Teleport: class {
        info: any;

        constructor(info) {
            this.info = info;
        }

        serialize() {
            return [Packets.Teleport, this.info];
        }
    },

    Despawn: class {
        id: any;

        constructor(id) {
            this.id = id;
        }

        serialize() {
            return [Packets.Despawn, this.id];
        }
    },

    Animation: class {
        id: any;

        info: any;

        constructor(id, data) {
            this.id = id;
            this.info = data;
        }

        serialize() {
            return [Packets.Animation, this.id, this.info];
        }
    },

    // TODO: Revise this when going over combat.
    Combat: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Combat, this.opcode, this.info];
        }
    },

    Projectile: class {
        opcode: any;

        info: any;

        constructor(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }

        serialize() {
            return [Packets.Projectile, this.opcode, this.info];
        }
    },

    Population: class {
        playerCount: any;

        constructor(playerCount) {
            this.playerCount = playerCount;
        }

        serialize() {
            return [Packets.Population, this.playerCount];
        }
    },

    Points: class {
        info: any;

        constructor(data) {
            this.info = data;
        }

        serialize() {
            return [Packets.Points, this.info];
        }
    },

    Network: class {
        opcode: any;

        constructor(opcode) {
            this.opcode = opcode;
        }

        serialize() {
            return [Packets.Network, this.opcode];
        }
    },

    Chat: class {
        info: any;

        constructor(data) {
            this.info = data;
        }

        serialize() {
            return [Packets.Chat, this.info];
        }
    },

    Command: class {
        info: any;

        constructor(data) {
            this.info = data;
        }

        serialize() {
            return [Packets.Command, this.info];
        }
    },

    /**
     * Should we just have a packet that represents containers
     * as a whole or just send it separately for each?
     */

    Inventory: class {
        opcode: any;

        info: any;

        constructor(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }

        serialize() {
            return [Packets.Inventory, this.opcode, this.info];
        }
    },

    Bank: class {
        opcode: any;

        info: any;

        constructor(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }

        serialize() {
            return [Packets.Bank, this.opcode, this.info];
        }
    },

    Ability: class {
        opcode: any;

        info: any;

        constructor(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }

        serialize() {
            return [Packets.Ability, this.opcode, this.info];
        }
    },

    Quest: class {
        opcode: any;

        info: any;

        constructor(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }

        serialize() {
            return [Packets.Quest, this.opcode, this.info];
        }
    },

    Notification: class {
        opcode: any;

        message: any;

        constructor(opcode, message) {
            this.opcode = opcode;
            this.message = message;
        }

        serialize() {
            return [Packets.Notification, this.opcode, this.message];
        }
    },

    Blink: class {
        instance: any;

        constructor(instance) {
            this.instance = instance;
        }

        serialize() {
            return [Packets.Blink, this.instance];
        }
    },

    Heal: class {
        info: any;

        constructor(info) {
            this.info = info;
        }

        serialize() {
            return [Packets.Heal, this.info];
        }
    },

    Experience: class {
        info: any;

        constructor(info) {
            this.info = info;
        }

        serialize() {
            return [Packets.Experience, this.info];
        }
    },

    Death: class {
        id: any;

        constructor(id) {
            this.id = id;
        }

        serialize() {
            return [Packets.Death, this.id];
        }
    },

    Audio: class {
        song: any;

        constructor(song) {
            this.song = song;
        }

        serialize() {
            return [Packets.Audio, this.song];
        }
    },

    NPC: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.NPC, this.opcode, this.info];
        }
    },

    Respawn: class {
        instance: any;

        x: any;

        y: any;

        constructor(instance, x, y) {
            this.instance = instance;
            this.x = x;
            this.y = y;
        }

        serialize() {
            return [Packets.Respawn, this.instance, this.x, this.y];
        }
    },

    Enchant: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Enchant, this.opcode, this.info];
        }
    },

    Guild: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Guild, this.opcode, this.info];
        }
    },

    Pointer: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Pointer, this.opcode, this.info];
        }
    },

    PVP: class {
        id: any;

        pvp: any;

        constructor(id, pvp) {
            this.id = id;
            this.pvp = pvp;
        }

        serialize() {
            return [Packets.PVP, this.id, this.pvp];
        }
    },

    Shop: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Shop, this.opcode, this.info];
        }
    },

    Minigame: class {
        opcode: any;

        info: any;

        constructor(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Minigame, this.opcode, this.info];
        }
    },

    Region: class {
        opcode: any;

        info: any;

        constructor(opcode, info, force?) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Region, this.opcode, this.info];
        }
    },

    Overlay: class {
        opcode: any;

        info: any;

        constructor(opcode, info?) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Overlay, this.opcode, this.info];
        }
    },

    Camera: class {
        opcode: any;

        info: any;

        constructor(opcode, info?) {
            this.opcode = opcode;
            this.info = info;
        }

        serialize() {
            return [Packets.Camera, this.opcode, this.info];
        }
    },

    Bubble: class {
        info: any;

        constructor(info) {
            this.info = info;
        }

        serialize() {
            return [Packets.Bubble, this.info];
        }
    },
};
